import { HfInference } from '@huggingface/inference'
import fetch from 'cross-fetch'

// Initialize Hugging Face client for embeddings
function getHuggingFaceClient() {
  const apiKey = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_HUGGINGFACE_API_KEY environment variable is not set');
  }

  return new HfInference(apiKey);
}

// Interface for document metadata
interface BookMetadata {
  bookId: string
  title: string
  author: string
  chunkIndex: number
  text: string
}

function getHeaders() {
  const apiKey = process.env.NEXT_PUBLIC_PINECONE_API_KEY;
  
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_PINECONE_API_KEY environment variable is not set');
  }

  return {
    'Api-Key': apiKey,
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  } as const;
}

function getPineconeUrl() {
  const environment = process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT;
  
  if (!environment) {
    throw new Error('NEXT_PUBLIC_PINECONE_ENVIRONMENT environment variable is not set');
  }

  // Format: https://{index-name}-{project-id}.svc.{environment}.pinecone.io
  return 'https://book-summaries-a6tdemr.svc.aped-4627-b74a.pinecone.io';
}

// Initialize the index
export async function initializeIndex(): Promise<void> {
  try {
    console.log('Initializing Pinecone index...');
    
    // Test connection by getting index stats
    const baseUrl = getPineconeUrl();
    const url = `${baseUrl}/describe_index_stats`;
    console.log('Making request to:', url);
    
    const headers = getHeaders();
    console.log('Using headers:', {
      ...headers,
      'Api-Key': '***'
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to connect to Pinecone: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('Index stats:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error connecting to Pinecone:', error);
    throw new Error('Failed to initialize Pinecone index');
  }
}

// Generate embeddings using Hugging Face
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const hf = getHuggingFaceClient();
    const response = await hf.featureExtraction({
      model: 'BAAI/bge-small-en-v1.5',
      inputs: text,
    })
    // Convert response to number array
    if (typeof response === 'number') {
      return [response]
    } else if (Array.isArray(response)) {
      return response.map(v => typeof v === 'number' ? v : 0)
    }
    return [0]
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}

// Add document chunks to Pinecone
export async function addDocumentChunks(bookId: string, chunks: { text: string; metadata: BookMetadata }[]): Promise<void> {
  try {
    const embeddings = await Promise.all(chunks.map(chunk => generateEmbedding(chunk.text)));
    
    const vectors = chunks.map((chunk, index) => ({
      id: `${bookId}-${index}`,
      values: embeddings[index],
      metadata: chunk.metadata
    }));

    const baseUrl = getPineconeUrl();
    const response = await fetch(
      `${baseUrl}/vectors/upsert`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          vectors,
          namespace: ''
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add vectors: ${response.status} ${response.statusText}\n${errorText}`);
    }
  } catch (error) {
    console.error('Error adding document chunks:', error);
    throw error;
  }
}

// Query the index
export async function queryIndex(query: string): Promise<{ text: string; metadata: BookMetadata }[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);

    const baseUrl = getPineconeUrl();
    const response = await fetch(
      `${baseUrl}/query`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          vector: queryEmbedding,
          topK: 5,
          includeMetadata: true,
          namespace: ''
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to query index: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    return data.matches.map((match: any) => ({
      text: match.metadata.text,
      metadata: match.metadata
    }));
  } catch (error) {
    console.error('Error querying index:', error);
    throw error;
  }
}

// Delete all entries for a specific book
export async function deleteBookEntries(bookId: string): Promise<void> {
  try {
    const baseUrl = getPineconeUrl();
    const response = await fetch(
      `${baseUrl}/vectors/delete`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ids: [`${bookId}-*`],
          namespace: ''
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete vectors: ${response.status} ${response.statusText}\n${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting book entries:', error);
    throw error;
  }
} 