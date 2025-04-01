import { ChromaClient, Collection, GetCollectionParams, Metadata, IEmbeddingFunction } from 'chromadb'
import { HfInference } from '@huggingface/inference'

// ChromaDB client instance with authentication
export const chroma = new ChromaClient({
  path: process.env.CHROMA_SERVER_URL || 'http://localhost:8000',
  fetchOptions: {
    keepalive: true,
    headers: {
      'Authorization': `Basic ${Buffer.from(`${process.env.CHROMA_AUTH_USERNAME}:${process.env.CHROMA_AUTH_PASSWORD}`).toString('base64')}`
    }
  }
})

// Hugging Face client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY)

// Collection name for book summaries
const COLLECTION_NAME = 'book_summaries'

// Embedding function using Hugging Face's BAAI/bge-small-en-v1.5 model
const embeddingFunction: IEmbeddingFunction = {
  generate: async (texts: string[]): Promise<number[][]> => {
    try {
      const embeddings = await Promise.all(
        texts.map(async (text) => {
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
        })
      )
      return embeddings
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw new Error('Failed to generate embeddings')
    }
  }
}

// Interface for document metadata
interface BookMetadata extends Record<string, string | number | boolean> {
  bookId: string
  title: string
  author: string
  chunkIndex: number
}

// Type guard to check if an object is a collection
function isCollection(obj: any): obj is { name: string } {
  return obj && typeof obj === 'object' && typeof obj.name === 'string'
}

// Singleton instance of the collection
let bookSummariesCollection: Collection | null = null

/**
 * Initialize the ChromaDB collection for book summaries
 * @returns Promise<Collection>
 */
export async function initializeCollection(): Promise<Collection> {
  try {
    if (!bookSummariesCollection) {
      // Check if collection exists
      const collections = await chroma.listCollections()
      const existingCollection = collections.find(collection => isCollection(collection) && collection.name === COLLECTION_NAME)

      if (existingCollection) {
        const params: GetCollectionParams = {
          name: COLLECTION_NAME,
          embeddingFunction
        }
        bookSummariesCollection = await chroma.getCollection(params)
        console.log('Retrieved existing collection:', COLLECTION_NAME)
      } else {
        bookSummariesCollection = await chroma.createCollection({
          name: COLLECTION_NAME,
          embeddingFunction,
          metadata: { 
            description: "Book summaries for Library MVP",
            created_at: new Date().toISOString()
          }
        })
        console.log('Created new collection:', COLLECTION_NAME)
      }
    }
    return bookSummariesCollection
  } catch (error) {
    console.error('Error initializing ChromaDB collection:', error)
    throw new Error('Failed to initialize ChromaDB collection')
  }
}

/**
 * Add document chunks to the collection
 * @param chunks Array of text chunks from the document
 * @param metadata Book metadata without chunkIndex
 * @returns Promise<void>
 */
export async function addDocumentChunks(
  chunks: string[],
  baseMetadata: { bookId: string; title: string; author: string }
): Promise<void> {
  try {
    const collection = await initializeCollection()
    
    // Add each chunk with its metadata
    await Promise.all(
      chunks.map((chunk, index) => {
        const chunkMetadata: BookMetadata = {
          ...baseMetadata,
          chunkIndex: index
        }
        
        return collection.add({
          ids: [`${baseMetadata.bookId}-${index}`],
          documents: [chunk],
          metadatas: [chunkMetadata]
        })
      })
    )
    
    console.log(`Added ${chunks.length} chunks for book: ${baseMetadata.title}`)
  } catch (error) {
    console.error('Error adding document chunks:', error)
    throw new Error('Failed to add document chunks to ChromaDB')
  }
}

/**
 * Query the collection for relevant text chunks
 * @param query Search query
 * @param limit Maximum number of results
 * @returns Promise with search results
 */
export async function queryCollection(query: string, limit: number = 5) {
  try {
    const collection = await initializeCollection()
    
    const results = await collection.query({
      queryTexts: [query],
      nResults: limit
    })
    
    return results
  } catch (error) {
    console.error('Error querying collection:', error)
    throw new Error('Failed to query ChromaDB collection')
  }
}

/**
 * Delete all entries for a specific book
 * @param bookId ID of the book to delete
 * @returns Promise<void>
 */
export async function deleteBookEntries(bookId: string): Promise<void> {
  try {
    const collection = await initializeCollection()
    
    // Get all entries for this book
    const results = await collection.get({
      where: { bookId }
    })
    
    if (results.ids.length > 0) {
      await collection.delete({
        ids: results.ids
      })
      console.log(`Deleted ${results.ids.length} entries for book: ${bookId}`)
    }
  } catch (error) {
    console.error('Error deleting book entries:', error)
    throw new Error('Failed to delete book entries from ChromaDB')
  }
} 