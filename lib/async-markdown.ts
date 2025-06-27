import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Safe sanitization function that works in both client and server environments
const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    // Server-side: return as-is or use a server-safe sanitizer
    return html;
  }
  return DOMPurify.sanitize(html);
};

interface MarkdownProcessorOptions {
  breaks?: boolean;
  gfm?: boolean;
  sanitize?: boolean;
  useWorker?: boolean;
}

/**
 * Asynchronous markdown processor that prevents UI blocking
 * This utility provides both regular and worker-based markdown processing
 */
class AsyncMarkdownProcessor {
  private options: MarkdownProcessorOptions;
  private worker: Worker | null = null;
  private workerReady = false;
  private taskQueue: Map<string, {
    resolve: (value: string) => void;
    reject: (reason: any) => void;
  }> = new Map();

  constructor(options: MarkdownProcessorOptions = {}) {
    this.options = {
      breaks: true,
      gfm: true,
      sanitize: true,
      useWorker: typeof window !== 'undefined' && !!window.Worker,
      ...options
    };
    
    if (this.options.useWorker) {
      this.initWorker();
    }
  }

  /**
   * Initialize the worker for background processing
   */
  private initWorker() {
    try {
      // Create a worker from an inline blob
      const workerCode = `
        importScripts('https://cdn.jsdelivr.net/npm/marked/marked.min.js');
        importScripts('https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js');
        
        self.onmessage = function(e) {
          if (e.data.type === 'parse') {
            try {
              const { id, markdown, options } = e.data;
              const html = marked.parse(markdown, options);
              
              // If DOMPurify is available in worker context, use it
              let sanitized = html;
              try {
                if (typeof DOMPurify !== 'undefined' && DOMPurify.sanitize) {
                  sanitized = DOMPurify.sanitize(html);
                } else if (typeof self.DOMPurify !== 'undefined') {
                  sanitized = self.DOMPurify.sanitize(html);
                }
              } catch (sanitizeError) {
                console.warn('DOMPurify not available in worker, returning unsanitized HTML');
              }
                
              self.postMessage({
                id,
                html: sanitized,
                error: null
              });
            } catch (error) {
              self.postMessage({
                id: e.data.id,
                html: null,
                error: error.message
              });
            }
          }
        };
        
        // Signal that worker is ready
        self.postMessage({ type: 'ready' });
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
      
      this.worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
          this.workerReady = true;
          return;
        }
        
        const { id, html, error } = e.data;
        const task = this.taskQueue.get(id);
        
        if (task) {
          if (error) {
            task.reject(new Error(error));
          } else {
            task.resolve(html);
          }
          this.taskQueue.delete(id);
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Markdown worker error:', error);
        // Fall back to non-worker mode
        this.worker = null;
        this.workerReady = false;
      };
    } catch (e) {
      console.error('Failed to initialize markdown worker:', e);
      this.worker = null;
      this.workerReady = false;
    }
  }

  /**
   * Parse markdown asynchronously to prevent UI blocking
   */
  async parse(markdown: string): Promise<string> {
    // Skip processing for empty content
    if (!markdown || markdown.trim() === '') {
      return '';
    }
    
    // Use worker if available
    if (this.worker && this.workerReady) {
      return this.parseWithWorker(markdown);
    }
    
    // Fall back to setTimeout for async processing without a worker
    return this.parseWithTimeout(markdown);
  }

  /**
   * Parse markdown using a web worker
   */
  private parseWithWorker(markdown: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      
      this.taskQueue.set(id, { resolve, reject });
      
      this.worker!.postMessage({
        type: 'parse',
        id,
        markdown,
        options: {
          breaks: this.options.breaks,
          gfm: this.options.gfm
        }
      });
    });
  }

  /**
   * Parse markdown using setTimeout to avoid blocking UI
   */
  private parseWithTimeout(markdown: string): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const html = marked.parse(markdown, {
            breaks: this.options.breaks,
            gfm: this.options.gfm
          }) as string;
          
          const sanitized = this.options.sanitize ? 
            sanitizeHtml(html) : html;
            
          resolve(sanitized);
        } catch (error) {
          reject(error);
        }
      }, 0);
    });
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.taskQueue.clear();
  }
}

// Singleton instance for easy import
const markdownProcessor = new AsyncMarkdownProcessor();

export default markdownProcessor;
