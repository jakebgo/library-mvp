import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { addDocumentChunks, initializeIndex } from './pinecone';

interface BookMetadata {
  title: string;
  author: string;
  file_path: string;
  created_at: string;
}

function sanitizeFileName(name: string): string {
  // Remove special characters and spaces, convert to lowercase
  return name.toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Function to chunk text into smaller pieces
function chunkText(text: string, chunkSize: number = 1000): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function uploadBookSummary(
  file: File,
  title: string,
  author: string
): Promise<void> {
  const supabase = createClientComponentClient();

  try {
    // Initialize Pinecone
    await initializeIndex();

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const safeTitle = sanitizeFileName(title);
    const randomString = Math.random().toString(36).substring(2, 6);
    const fileName = `${safeTitle}-${randomString}.${fileExt}`;
    const filePath = `summaries/${fileName}`;

    // Read file content
    const fileContent = await file.text();

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(filePath, file, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Failed to upload file: ${uploadError.message}`);
    }

    // 2. Save metadata to Supabase Database
    const { data: book, error: dbError } = await supabase
      .from('books')
      .insert([
        {
          title,
          author,
          file_path: filePath,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database insert error:', dbError);
      throw new Error(`Failed to save book metadata: ${dbError.message}`);
    }

    if (!book) {
      throw new Error('Failed to get book data after insert');
    }

    // 3. Process text and store in Pinecone
    const chunks = chunkText(fileContent);
    console.log(`Processing ${chunks.length} chunks for book: ${title}`);
    
    const documentChunks = chunks.map((chunk, index) => ({
      text: chunk,
      metadata: {
        bookId: book.id,
        title,
        author,
        chunkIndex: index,
        text: chunk
      }
    }));

    await addDocumentChunks(book.id, documentChunks);
    console.log(`Successfully processed all chunks for book: ${title}`);

  } catch (error) {
    console.error('Error uploading book summary:', error);
    throw error;
  }
} 