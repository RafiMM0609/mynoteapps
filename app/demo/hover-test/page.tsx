import MarkdownPreview from '@/components/MarkdownPreview';

export default function HoverTestPage() {
  const testMarkdown = `
# Code Block Hover Test

Ini adalah halaman test untuk memastikan hover effect pada code block bekerja dengan baik.

## JavaScript Example
Hover pada code block di bawah ini untuk melihat efek transisi:

\`\`\`javascript
function greetUser(name) {
  console.log(\`Hello, \${name}!\`);
  
  // Check if user exists
  if (name && name.length > 0) {
    return \`Welcome back, \${name}!\`;
  }
  
  return "Welcome, guest!";
}

// Usage example
const message = greetUser("John Doe");
console.log(message);
\`\`\`

## Python Example
Coba hover pada code block Python ini:

\`\`\`python
def calculate_fibonacci(n):
    """Calculate fibonacci sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    fib_sequence = [0, 1]
    for i in range(2, n):
        next_fib = fib_sequence[i-1] + fib_sequence[i-2]
        fib_sequence.append(next_fib)
    
    return fib_sequence

# Test the function
result = calculate_fibonacci(10)
print(f"Fibonacci sequence: {result}")
\`\`\`

## CSS Example
Hover effect juga berlaku untuk CSS:

\`\`\`css
.modern-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  padding: 12px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px 0 rgba(102, 126, 234, 0.4);
}

.modern-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px 0 rgba(102, 126, 234, 0.6);
}
\`\`\`

## Inline Code Test
Inline code juga memiliki hover effect: \`console.log("Hello World")\`, \`import React from 'react'\`, dan \`npm install package-name\`.

## Terminal Example
\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
\`\`\`

Silakan hover pada setiap code block untuk melihat efek transisi dari dark theme ke light theme dengan border biru yang lebih prominent.
`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Code Block Hover Test
              </h1>
              <p className="text-gray-600">
                Test hover effects pada code blocks dengan berbagai bahasa pemrograman
              </p>
            </div>
              <div className="markdown-content">
              <MarkdownPreview 
                content={testMarkdown} 
                availableNotes={[]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
