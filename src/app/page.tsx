export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <h1 className="text-4xl font-bold mb-8">Welcome to your Library</h1>
      <p className="text-xl text-gray-600 mb-12 text-center max-w-2xl">
        Upload your books and ask questions about them using AI.
      </p>
      <div className="flex gap-4">
        <a
          href="/upload"
          className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          Upload Book
        </a>
        <a
          href="/chat"
          className="px-6 py-3 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
        >
          Ask Questions
        </a>
      </div>
    </div>
  )
} 