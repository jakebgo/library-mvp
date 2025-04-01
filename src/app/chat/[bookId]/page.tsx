import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ChatInterface from '@/components/chat/ChatInterface'

interface ChatPageProps {
  params: {
    bookId: string
  }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = createServerComponentClient({ cookies })
  
  // Fetch book details
  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', params.bookId)
    .single()

  if (error || !book) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
        <p className="text-gray-600">By {book.author}</p>
      </div>
      <ChatInterface bookId={book.id} bookTitle={book.title} />
    </div>
  )
} 