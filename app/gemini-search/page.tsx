import GeminiSearchChat from '@/components/GeminiSearchChat';

export default function GeminiSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gemini AI dengan Search Engine
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Pengalaman AI yang ditingkatkan dengan kemampuan pencarian web real-time. 
            Dapatkan jawaban yang akurat dan terkini dari kombinasi kecerdasan buatan 
            dan informasi web terbaru.
          </p>
        </div>
        
        <GeminiSearchChat />
      </div>
    </div>
  );
}
