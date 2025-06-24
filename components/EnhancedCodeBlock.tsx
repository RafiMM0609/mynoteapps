'use client'

import React, { useState, useRef } from 'react';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';

interface CodeBlockProps {
  children: string;
  language?: string;
  title?: string;
  showLineNumbers?: boolean;
  highlightedLines?: number[];
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  children,
  language = 'text',
  title,
  showLineNumbers = false,
  highlightedLines = [],
  className = ''
}) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const handleCopy = async () => {
    if (codeRef.current) {
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  const lines = children.split('\n');

  return (
    <div className={`code-block-container ${className}`}>
      {title && (
        <div className="code-block-title">
          {title}
        </div>
      )}
      <div className="relative">
        <pre 
          className={`
            ${showLineNumbers ? 'line-numbers' : ''} 
            language-${language}
          `}
          data-language={language}
        >
          <code ref={codeRef} className={`language-${language}`}>
            {showLineNumbers ? (
              lines.map((line, index) => (
                <div 
                  key={index}
                  className={`line ${highlightedLines.includes(index + 1) ? 'highlighted' : ''}`}
                >
                  {line}
                  {index === lines.length - 1 && <span className="cursor" />}
                </div>
              ))
            ) : (
              <>
                {children}
                <span className="cursor" />
              </>
            )}
          </code>
        </pre>
        <button
          onClick={handleCopy}
          className={`copy-button ${copied ? 'copied' : ''}`}
          title={copied ? 'Copied!' : 'Copy code'}
        >
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="w-4 h-4" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface InlineCodeProps {
  children: React.ReactNode;
  language?: string;
  className?: string;
}

export const InlineCode: React.FC<InlineCodeProps> = ({
  children,
  language,
  className = ''
}) => {
  return (
    <code 
      className={`
        ${language ? `language-${language}` : ''} 
        ${className}
      `}
    >
      {children}
    </code>
  );
};

// Enhanced Markdown Preview component with better code handling
interface EnhancedMarkdownPreviewProps {
  content: string;
  className?: string;
}

export const EnhancedMarkdownPreview: React.FC<EnhancedMarkdownPreviewProps> = ({
  content,
  className = ''
}) => {
  // Simple markdown parser for demonstration
  // In a real app, you'd use a proper markdown parser like remark or marked
  const parseMarkdown = (text: string) => {
    return text
      .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
        const language = lang || 'text';
        return `<div class="code-block-wrapper" data-language="${language}" data-code="${encodeURIComponent(code.trim())}"></div>`;
      })
      .replace(/`([^`]+)`/g, (match, code) => {
        return `<code class="inline-code">${code}</code>`;
      });
  };

  return (
    <div 
      className={`prose prose-slate max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
};

// Demo component to showcase the new code styling
export const CodeStyleDemo: React.FC = () => {
  const jsCode = `// Modern JavaScript with async/await
const fetchUserData = async (userId) => {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    const userData = await response.json();
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }
    
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

// Usage example
const user = await fetchUserData(123);
console.log(user.name);`;

  const pythonCode = `# Python data processing example
import pandas as pd
import numpy as np
from datetime import datetime

def process_data(file_path: str) -> pd.DataFrame:
    """
    Process CSV data and return cleaned DataFrame
    """
    # Read data
    df = pd.read_csv(file_path)
    
    # Clean data
    df = df.dropna()
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    
    # Add calculated columns
    df['year'] = df['timestamp'].dt.year
    df['month'] = df['timestamp'].dt.month
    
    return df

# Usage
data = process_data('data.csv')
print(f"Processed {len(data)} records")`;

  const cssCode = `/* Modern CSS with custom properties */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #8b5cf6;
  --text-color: #1f2937;
  --bg-color: #ffffff;
  --border-radius: 0.75rem;
  --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.modern-card {
  background: var(--bg-color);
  color: var(--text-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: transform 0.2s ease-in-out;
}

.modern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --text-color: #f9fafb;
    --bg-color: #1f2937;
  }
}`;

  const terminalCode = `$ npm install @mynote/enhanced-ui
$ npm run dev

🚀 Starting development server...
✨ Server ready at http://localhost:3000
📝 Enhanced code styling loaded
🎨 Beautiful UI components ready
💫 All features initialized successfully!

> Ready for development`;

  const sqlCode = `-- Advanced SQL query with window functions
WITH user_stats AS (
  SELECT 
    user_id,
    COUNT(*) as note_count,
    AVG(LENGTH(content)) as avg_note_length,
    ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank
  FROM notes 
  WHERE created_at >= '2024-01-01'
  GROUP BY user_id
),
active_users AS (
  SELECT 
    u.id,
    u.email,
    us.note_count,
    us.avg_note_length,
    us.rank,
    CASE 
      WHEN us.note_count > 100 THEN 'Power User'
      WHEN us.note_count > 20 THEN 'Active User'
      ELSE 'Casual User'
    END as user_type
  FROM users u
  JOIN user_stats us ON u.id = us.user_id
)
SELECT * FROM active_users
ORDER BY note_count DESC
LIMIT 10;`;

  return (
    <div className="space-y-12 p-8 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          ✨ Enhanced Code Styling Demo
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Beautiful, modern code blocks with enhanced features, copy functionality, and interactive elements
        </p>
      </div>

      <div className="grid gap-12 max-w-6xl mx-auto">
        {/* JavaScript Example */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <span className="text-yellow-800 font-bold text-sm">JS</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">JavaScript with Async/Await</h2>
          </div>
          <CodeBlock
            language="javascript"
            title="fetchUserData.js"
            showLineNumbers={true}
            highlightedLines={[3, 7, 12]}
          >
            {jsCode}
          </CodeBlock>
        </div>

        {/* Python Example */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐍</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Python Data Processing</h2>
          </div>
          <CodeBlock
            language="python"
            title="data_processor.py"
            showLineNumbers={true}
            highlightedLines={[8, 15, 18]}
          >
            {pythonCode}
          </CodeBlock>
        </div>

        {/* CSS Example */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">CSS</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Modern CSS with Custom Properties</h2>
          </div>
          <CodeBlock
            language="css"
            title="styles.css"
            showLineNumbers={true}
            highlightedLines={[1, 10, 23]}
          >
            {cssCode}
          </CodeBlock>
        </div>

        {/* Terminal Example */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">$</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Terminal Commands</h2>
          </div>
          <div className="code-block-terminal">
            <CodeBlock
              language="bash"
              showLineNumbers={false}
            >
              {terminalCode}
            </CodeBlock>
          </div>
        </div>

        {/* SQL Example */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SQL</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Advanced SQL Query</h2>
          </div>
          <CodeBlock
            language="sql"
            title="user_analytics.sql"
            showLineNumbers={true}
            highlightedLines={[5, 12, 20]}
          >
            {sqlCode}
          </CodeBlock>
        </div>

        {/* Inline Code Examples */}
        <div className="space-y-6 bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">📝</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">Inline Code Examples</h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed">
              Use <InlineCode language="javascript">console.log()</InlineCode> for debugging JavaScript applications.
              For Python, you can use <InlineCode language="python">print()</InlineCode> or the 
              <InlineCode language="python">logging</InlineCode> module for better output control.
            </p>
            <p className="text-gray-700 leading-relaxed">
              In CSS, you can define custom properties with <InlineCode language="css">--custom-property: value</InlineCode> 
              and use them with <InlineCode language="css">var(--custom-property)</InlineCode> for better maintainability.
            </p>
            <p className="text-gray-700 leading-relaxed">
              TypeScript interfaces are defined with <InlineCode language="typescript">interface MyInterface {}</InlineCode> 
              and HTML elements use <InlineCode language="html">&lt;div class="container"&gt;</InlineCode> syntax.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Database queries can use <InlineCode language="sql">SELECT * FROM users WHERE active = true</InlineCode> 
              and shell commands like <InlineCode language="bash">npm install package-name</InlineCode> for package management.
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">✨ Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">📋 Copy to Clipboard</h3>
              <p className="text-sm opacity-90">One-click copy functionality with visual feedback</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">🎨 Language Detection</h3>
              <p className="text-sm opacity-90">Automatic syntax highlighting for 20+ languages</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">📱 Mobile Optimized</h3>
              <p className="text-sm opacity-90">Responsive design that works on all devices</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">🔍 Line Highlighting</h3>
              <p className="text-sm opacity-90">Highlight specific lines for better focus</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">♿ Accessible</h3>
              <p className="text-sm opacity-90">Full keyboard navigation and screen reader support</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <h3 className="font-semibold mb-2">🌙 Dark Mode</h3>
              <p className="text-sm opacity-90">Beautiful dark theme with proper contrast</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeBlock;
