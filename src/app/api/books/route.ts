import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (booksError) {
      console.error('Error fetching books:', booksError);
      return NextResponse.json(
        { message: 'Failed to fetch books' },
        { status: 500 }
      );
    }

    return NextResponse.json({ books });
  } catch (error) {
    console.error('Error in books route:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 