import TurndownService from 'turndown'
import { remark } from 'remark'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

// Configure turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx', // Use # for headings
  codeBlockStyle: 'fenced', // Use ``` for code blocks
  fence: '```', // Use ``` for code fences
  emDelimiter: '*', // Use * for emphasis
  strongDelimiter: '**', // Use ** for strong
  bulletListMarker: '-', // Use - for bullet lists
})

// Add custom rules for better conversion
turndownService.addRule('strikethrough', {
  filter: ['del', 's'],
  replacement: function (content: string) {
    return '~~' + content + '~~'
  }
})

turndownService.addRule('underline', {
  filter: 'u',
  replacement: function (content: string) {
    return '_' + content + '_'
  }
})

/**
 * Convert HTML content to Markdown
 */
export function htmlToMarkdown(html: string): string {
  if (!html || html.trim() === '') return ''
  
  try {
    // Clean up the HTML first
    const cleanHtml = html
      .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
      .replace(/&nbsp;/g, ' ') // Convert &nbsp; to spaces
      .replace(/<div>/gi, '\n') // Convert <div> to newlines
      .replace(/<\/div>/gi, '') // Remove closing div tags
      .trim()
    
    const markdown = turndownService.turndown(cleanHtml)
    
    // Clean up the markdown
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Reduce multiple newlines to double
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim()
  } catch (error) {
    console.error('Error converting HTML to Markdown:', error)
    return html // Return original HTML if conversion fails
  }
}

/**
 * Convert Markdown content to HTML for display
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown || markdown.trim() === '') return ''
  
  try {
    const result = await remark()
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
    
    return result.toString()
  } catch (error) {
    console.error('Error converting Markdown to HTML:', error)
    return markdown // Return original markdown if conversion fails
  }
}

/**
 * Check if content is likely HTML or Markdown
 */
export function detectContentFormat(content: string): 'html' | 'markdown' {
  if (!content || content.trim() === '') return 'markdown'
  
  // Check for HTML tags
  const htmlTagRegex = /<\/?[a-z][\s\S]*>/i
  const hasHtmlTags = htmlTagRegex.test(content)
  
  // Check for Markdown syntax
  const markdownRegex = /^(#{1,6}\s|[\*\-\+]\s|\d+\.\s|```|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/m
  const hasMarkdownSyntax = markdownRegex.test(content)
  
  if (hasHtmlTags && !hasMarkdownSyntax) {
    return 'html'
  }
  
  return 'markdown'
}

/**
 * Migrate content from HTML to Markdown if needed
 */
export function migrateContentToMarkdown(content: string): string {
  const format = detectContentFormat(content)
  
  if (format === 'html') {
    return htmlToMarkdown(content)
  }
  
  return content
}
