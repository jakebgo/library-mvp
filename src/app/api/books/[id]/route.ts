import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { deleteBookEntries } from '@/lib/pinecone';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerComponentClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookId = params.id;

    // Delete from Pinecone
    try {
      await deleteBookEntries(bookId);
    } catch (error) {
      console.error('Error deleting from Pinecone:', error);
      // Continue with deletion even if Pinecone deletion fails
    }

    // Delete from Supabase storage
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('file_path')
      .eq('id', bookId)
      .single();

    if (bookError) {
      console.error('Error fetching book:', bookError);
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const { error: storageError } = await supabase.storage
      .from('books')
      .remove([book.file_path]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
      // Continue with deletion even if storage deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (deleteError) {
      console.error('Error deleting book:', deleteError);
      return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in delete API:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 