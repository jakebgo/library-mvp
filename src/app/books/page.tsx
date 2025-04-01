import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Link from 'next/link'
import DeleteButton from '@/components/DeleteButton'

export const dynamic = 'force-dynamic'

interface Book {
  id: string
  title: string
  author: string
  file_path: string
  created_at: string
}

export default async function BooksPage() {
  const cookieStore = cookies()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })
    .returns<Book[]>()

  if (error) {
    console.error('Error fetching books:', error)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Library</h1>
        <Link 
          href="/upload" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Upload New Book
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Failed to load books. Please try again later.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {books?.map((book: Book) => (
          <div 
            key={book.id} 
            className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{book.title}</h2>
              <DeleteButton bookId={book.id} />
            </div>
            <p className="text-gray-600 mb-4">By {book.author}</p>
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>
                Added {new Date(book.created_at).toLocaleDateString()}
              </span>
              <Link 
                href={`/chat/${book.id}`} 
                className="text-blue-500 hover:text-blue-600"
              >
                Chat about this book →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {books?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No books uploaded yet.</p>
          <Link 
            href="/upload" 
            className="text-blue-500 hover:text-blue-600"
          >
            Upload your first book →
          </Link>
        </div>
      )}
    </div>
  )
} 