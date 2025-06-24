import { CodeStyleDemo } from '@/components/EnhancedCodeBlock';

export default function CodeStylingDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto py-8">
        <CodeStyleDemo />
      </div>
    </div>
  );
}
