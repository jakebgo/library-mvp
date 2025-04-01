import dotenv from 'dotenv'
import fetch from 'cross-fetch'

// Load environment variables
dotenv.config({ path: '.env.local' })

async function createPineconeIndex() {
  const apiKey = process.env.PINECONE_API_KEY
  const environment = process.env.PINECONE_ENVIRONMENT
  const baseUrl = `https://controller.${environment}.pinecone.io`
  const indexName = 'book-summaries'

  console.log('Creating Pinecone serverless index...')
  console.log('Base URL:', baseUrl)
  
  try {
    // Create index
    const response = await fetch(`${baseUrl}/databases`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey || '',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: indexName,
        dimension: 384,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        },
        type: 'serverless'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`)
    }

    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    // Wait for index to be ready
    console.log('Waiting for index to be ready...')
    await checkIndexStatus(baseUrl, apiKey || '', indexName)
    
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

async function checkIndexStatus(baseUrl: string, apiKey: string, indexName: string) {
  while (true) {
    const response = await fetch(`${baseUrl}/databases/${indexName}`, {
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to check index status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Index status:', data.status)

    if (data.status?.ready) {
      console.log('Index is ready!')
      break
    }

    console.log('Index not ready yet, waiting 5 seconds...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
}

createPineconeIndex() 