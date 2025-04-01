import dotenv from 'dotenv'
import path from 'path'
import { initializeIndex, addDocumentChunks, queryIndex, deleteBookEntries } from '../src/lib/pinecone'

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading environment variables from:', envPath)
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('Error loading .env.local file:', result.error)
  process.exit(1)
}

console.log('Environment variables loaded:', {
  PINECONE_API_KEY: process.env.PINECONE_API_KEY ? '***' : undefined,
  PINECONE_ENVIRONMENT: process.env.PINECONE_ENVIRONMENT
})

async function testPinecone() {
  console.log('Starting Pinecone test...')
  
  try {
    // 1. Initialize and check index
    console.log('\n1. Checking index...')
    await initializeIndex()

    // 2. Add test document
    console.log('\n2. Adding test document...')
    const chunk1Text = 'This is a test document chunk one.'
    const chunk2Text = 'This is a test document chunk two.'
    const chunk3Text = 'This is a test document chunk three.'
    
    const testChunks = [
      {
        text: chunk1Text,
        metadata: {
          bookId: 'test-book-1',
          title: 'Test Book',
          author: 'Test Author',
          chunkIndex: 0,
          text: chunk1Text
        }
      },
      {
        text: chunk2Text,
        metadata: {
          bookId: 'test-book-1',
          title: 'Test Book',
          author: 'Test Author',
          chunkIndex: 1,
          text: chunk2Text
        }
      },
      {
        text: chunk3Text,
        metadata: {
          bookId: 'test-book-1',
          title: 'Test Book',
          author: 'Test Author',
          chunkIndex: 2,
          text: chunk3Text
        }
      }
    ]
    await addDocumentChunks('test-book-1', testChunks)

    // 3. Query the index
    console.log('\n3. Querying index...')
    const results = await queryIndex('test document')
    console.log('Query results:', JSON.stringify(results, null, 2))

    // 4. Clean up
    console.log('\n4. Cleaning up...')
    await deleteBookEntries('test-book-1')

    console.log('\n✓ Test completed successfully')
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Test failed:', error.message)
      console.error('Error details:', {
        name: error.name,
        stack: error.stack
      })
    } else {
      console.error('❌ Test failed with unknown error:', error)
    }
  }
}

testPinecone()