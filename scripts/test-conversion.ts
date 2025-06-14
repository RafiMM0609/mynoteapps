import { htmlToMarkdown, markdownToHtml, detectContentFormat, migrateContentToMarkdown } from '../lib/markdown-converter'

/**
 * Test script to verify HTML to Markdown conversion
 */
async function testConversion() {
  console.log('🧪 Testing HTML to Markdown Conversion...\n')
  
  const testCases = [
    {
      name: 'Basic HTML with headings and text',
      html: '<h1>Main Title</h1><p>This is a <strong>bold</strong> paragraph with <em>italic</em> text.</p><h2>Subtitle</h2><p>Another paragraph.</p>'
    },
    {
      name: 'Lists and code',
      html: '<ul><li>First item</li><li>Second item</li></ul><p>Inline <code>code example</code> here.</p><pre><code>function hello() {\n  console.log("Hello world");\n}</code></pre>'
    },
    {
      name: 'Complex formatting',
      html: '<h3>Features</h3><ol><li><strong>Feature 1</strong>: Description here</li><li><em>Feature 2</em>: Another description</li></ol><p>Some text with <code>inline code</code> and <strong>bold text</strong>.</p>'
    },
    {
      name: 'Line breaks and divs',
      html: '<div>First line</div><div>Second line</div><br><p>After break</p>'
    }
  ]
  
  for (const testCase of testCases) {
    console.log(`📝 Testing: ${testCase.name}`)
    console.log('Original HTML:')
    console.log(testCase.html)
    console.log('\nConverted Markdown:')
    
    const markdown = htmlToMarkdown(testCase.html)
    console.log(markdown)
    
    console.log('\nBack to HTML:')
    const backToHtml = await markdownToHtml(markdown)
    console.log(backToHtml)
    
    console.log('\nFormat Detection:')
    console.log('HTML format detected:', detectContentFormat(testCase.html))
    console.log('Markdown format detected:', detectContentFormat(markdown))
    
    console.log('\n' + '='.repeat(60) + '\n')
  }
  
  // Test migration function
  console.log('🔄 Testing Migration Function...\n')
  
  const htmlContent = '<h1>Test Note</h1><p>This is a test note with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Item 1</li><li>Item 2</li></ul>'
  const markdownContent = '# Test Note\n\nThis is a test note with **bold** and *italic* text.\n\n- Item 1\n- Item 2'
  
  console.log('HTML content migration:', migrateContentToMarkdown(htmlContent))
  console.log('Markdown content migration:', migrateContentToMarkdown(markdownContent))
  
  console.log('\n✅ All tests completed!')
}

// Run tests
testConversion().catch(console.error)
