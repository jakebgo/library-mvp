import { initializeCollection, addDocumentChunks, queryCollection, deleteBookEntries } from './chroma'

async function testChromaDB() {
  try {
    console.log('Starting ChromaDB test...')

    // 1. Initialize collection
    console.log('\n1. Initializing collection...')
    const collection = await initializeCollection()
    console.log('✓ Collection initialized successfully')

    // 2. Add test document chunks
    console.log('\n2. Adding test document chunks...')
    const testChunks = [
      'This is the first chunk of text about artificial intelligence.',
      'The second chunk discusses machine learning and neural networks.',
      'In the third chunk, we explore deep learning applications.',
      'The fourth chunk covers natural language processing basics.'
    ]

    const testMetadata = {
      bookId: 'test-book-1',
      title: 'AI Fundamentals',
      author: 'Test Author'
    }

    await addDocumentChunks(testChunks, testMetadata)
    console.log('✓ Document chunks added successfully')

    // 3. Query the collection
    console.log('\n3. Testing query functionality...')
    const query = 'What is artificial intelligence?'
    const results = await queryCollection(query, 2)
    console.log('Query results:', JSON.stringify(results, null, 2))
    console.log('✓ Query functionality working')

    // 4. Delete test entries
    console.log('\n4. Testing deletion...')
    await deleteBookEntries(testMetadata.bookId)
    console.log('✓ Deletion successful')

    console.log('\n✨ All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testChromaDB() 