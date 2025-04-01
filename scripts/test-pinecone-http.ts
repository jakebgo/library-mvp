import dotenv from 'dotenv'
import fetch from 'cross-fetch'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function testPineconeHttp() {
  const apiKey = process.env.PINECONE_API_KEY
  const environment = process.env.PINECONE_ENVIRONMENT
  const baseUrl = `https://controller.${environment}.pinecone.io`

  console.log('Testing Pinecone HTTP connection...')
  console.log('Base URL:', baseUrl)
  
  try {
    // List indexes
    const response = await fetch(`${baseUrl}/databases`, {
      headers: {
        'Api-Key': apiKey || '',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
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

testPineconeHttp() 