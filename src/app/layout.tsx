import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import AuthButton from '../components/auth/AuthButton'

export const metadata: Metadata = {
  title: 'Library',
  description: 'A web app for uploading books and asking questions about them using AI.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-xl font-bold text-gray-800">
                Library
              </Link>
              <div className="flex items-center space-x-4">
                {session ? (
                  <>
                    <Link 
                      href="/books" 
                      className="text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Books
                    </Link>
                    <Link 
                      href="/upload" 
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Upload Book
                    </Link>
                    <AuthButton session={session} />
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
} 