import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { queryIndex } from '@/lib/pinecone';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5; // 5 requests per minute
const userRequestCounts = new Map<string, { count: number; timestamp: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const userRequests = userRequestCounts.get(userId);

  if (!userRequests) {
    userRequestCounts.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (now - userRequests.timestamp > RATE_LIMIT_WINDOW) {
    userRequestCounts.set(userId, { count: 1, timestamp: now });
    return false;
  }

  if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  userRequests.count++;
  return false;
}

interface SearchResult {
  text: string;
  metadata: {
    bookId: string;
    title: string;
    author: string;
    chunkIndex: number;
  };
}

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { message, bookId, isLibraryQuery } = await req.json();

    if (!message) {
      return NextResponse.json(
        { message: 'Message is required' },
        { status: 400 }
      );
    }

    let context = '';
    let systemPrompt = '';

    if (isLibraryQuery) {
      // Fetch all books from the user's library
      const { data: books, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      if (booksError) {
        console.error('Error fetching books:', booksError);
        return NextResponse.json(
          { message: 'Failed to fetch library information' },
          { status: 500 }
        );
      }

      if (!books || books.length === 0) {
        return NextResponse.json({
          response: "You don't have any books in your library yet. Upload some books to get started!"
        });
      }

      // Create a map of valid book IDs
      const validBookIds = new Set(books.map(book => book.id));

      // Create a summary of the library
      const librarySummary = books.map(book => 
        `- ${book.title} by ${book.author}`
      ).join('\n');

      systemPrompt = `You are a helpful library assistant. The user has the following books in their library:
${librarySummary}

You can help users find books, provide summaries, and answer questions about their library. 
When mentioning a book, wrap its title in double square brackets like this: [[Book Title]].
If a user asks about a specific book, mention it by name and provide relevant information.
If they ask about multiple books, list the relevant books and their connections.
Always be concise and direct in your responses.
Only mention books that are in the user's library.`;

      // Search for relevant content across all books
      const searchResults = await queryIndex(message);
      if (searchResults && searchResults.length > 0) {
        // Filter out results from deleted books and test data
        const validResults = searchResults.filter(result => {
          // Skip results without proper metadata
          if (!result.metadata || !result.metadata.bookId || !result.metadata.title || !result.metadata.author) {
            return false;
          }
          // Only include results from valid books
          return validBookIds.has(result.metadata.bookId);
        });

        if (validResults.length > 0) {
          context = validResults
            .map(result => `From "${result.metadata.title}": ${result.text}`)
            .join('\n\n');
        }
      }
    } else if (bookId) {
      // Handle single book queries
      const { data: book, error: bookError } = await supabase
        .from('books')
        .select('*')
        .eq('id', bookId)
        .single();

      if (bookError || !book) {
        console.error('Error fetching book:', bookError);
        return NextResponse.json(
          { message: 'Failed to fetch book information' },
          { status: 500 }
        );
      }

      const searchResults = await queryIndex(message);
      if (searchResults && searchResults.length > 0) {
        // Filter results to only include the requested book
        const bookResults = searchResults.filter(result => {
          // Skip results without proper metadata
          if (!result.metadata || !result.metadata.bookId || !result.metadata.title || !result.metadata.author) {
            return false;
          }
          // Only include results from the requested book
          return result.metadata.bookId === bookId;
        });

        if (bookResults.length > 0) {
          context = bookResults
            .map(result => result.text)
            .join('\n\n');
        }
      }

      systemPrompt = `You are a helpful assistant answering questions about the book "${book.title}" by ${book.author}. 
Use the following context to answer the user's questions. If the answer cannot be found in the context, say so.
Always be concise and direct in your responses.`;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://github.com/yourusername/library-mvp',
        'X-Title': 'Library MVP',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Context:\n${context}\n\nQuestion: ${message}` }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter API error:', error);
      return NextResponse.json(
        { message: 'Failed to get response from AI model' },
        { status: 500 }
      );
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      console.error('Invalid OpenRouter API response structure:', data);
      return NextResponse.json(
        { message: 'Invalid response from AI model' },
        { status: 500 }
      );
    }

    return NextResponse.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 