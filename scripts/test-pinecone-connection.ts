import { Pinecone } from '@pinecone-database/pinecone'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | unknown
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      const delay = initialDelay * Math.pow(2, i)
      console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  
  throw lastError
}

async function testConnection() {
  console.log('Testing Pinecone connection...')
  console.log('API Key:', process.env.PINECONE_API_KEY?.substring(0, 10) + '...')
  console.log('Environment:', process.env.PINECONE_ENVIRONMENT)
  
  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || '',
      environment: process.env.PINECONE_ENVIRONMENT || 'us-east-1-aws'
    })

    // List all indexes
    const indexes = await retryWithBackoff(() => pinecone.listIndexes())
    console.log('Available indexes:', indexes)

    // Get the index
    const index = pinecone.index('book-summaries')
    console.log('Successfully connected to index: book-summaries')

    // Try a simple upsert with retry
    console.log('Testing upsert operation...')
    const testVector = {
      id: 'test-vector',
      values: new Array(384).fill(0.1),
      metadata: {
        text: 'test document'
      }
    }
    
    await retryWithBackoff(() => index.upsert([testVector]))
    console.log('Successfully upserted test vector')

    // Try to query the vector back with retry
    console.log('Testing query operation...')
    const queryResult = await retryWithBackoff(() => 
      index.query({
        vector: new Array(384).fill(0.1),
        topK: 1,
        includeMetadata: true
      })
    )
    console.log('Query result:', queryResult)

  } catch (error) {
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    } else {
      console.error('Unknown error:', error)
    }
  }
}

testConnection() 