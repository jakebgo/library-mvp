import dotenv from 'dotenv'
import fetch from 'cross-fetch'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

async function testPineconeConnection() {
  const apiKey = process.env.PINECONE_API_KEY
  
  if (!apiKey) {
    throw new Error('PINECONE_API_KEY environment variable is not set')
  }

  const host = 'https://book-summaries-a6tdemr.svc.aped-4627-b74a.pinecone.io'
  console.log('Testing direct Pinecone connection...')
  console.log('Host:', host)

  try {
    const response = await fetch(`${host}/vectors/upsert`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vectors: [{
          id: 'test-vector',
          values: Array(384).fill(0).map(() => Math.random()),
          metadata: {
            text: 'test document',
          },
        }],
        namespace: '',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to connect: ${response.status} ${response.statusText}\n${errorText}`)
    }

    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('Error:', error)
  }
}

testPineconeConnection() 