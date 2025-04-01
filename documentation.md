# Library MVP Documentation

## Project Overview
A web application that enables users to upload book summaries and interact with them using AI-powered question answering. The application uses vector search to find relevant book content and OpenRouter's AI models to generate accurate responses.

## Architecture

### Frontend
- Built with Next.js 14.1.0 using the App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Responsive design with mobile-first approach

### Backend
- Next.js API routes for server-side functionality
- Supabase for database and authentication
- ChromaDB for vector search with Hugging Face embeddings
- OpenRouter for AI model access

### Key Components
1. **Home Page** (`src/app/page.tsx`)
   - Landing page with navigation to upload and chat features
   - Clean, modern UI with primary and secondary action buttons

2. **Upload Page** (`src/app/upload/page.tsx`)
   - Form for uploading book summaries
   - Handles file validation and storage
   - Provides user feedback and error handling
   - Stores book metadata in database

3. **Books Page** (`src/app/books/page.tsx`)
   - Displays grid of uploaded book summaries
   - Shows title, author, and upload date for each book
   - Links to chat interface for each book
   - Responsive layout (2 columns on medium screens, 3 on large screens)
   - Empty state handling with call-to-action
   - Server-side data fetching with Supabase

4. **Vector Search** (`src/lib/chroma.ts`)
   - ChromaDB integration for semantic search
   - Features:
     - Document chunking and embedding generation
     - Collection management with metadata
     - Query functionality for finding relevant passages
     - Deletion capabilities for book entries
   - Components:
     - Hugging Face embedding model (BAAI/bge-small-en-v1.5)
     - ChromaDB client configuration
     - Collection initialization and management
     - Document chunking and metadata handling
   - Implementation details:
     - Uses HTTP client with ChromaDB server
     - Embedding function converts text to vectors
     - Proper error handling and type safety
     - Singleton pattern for collection management

5. **Authentication** (`src/app/auth/*`)
   - Secure email/password authentication with Supabase Auth
   - Features:
     - Login and signup with email verification
     - Password reset flow with email confirmation
     - Protected routes with middleware
     - Session refresh handling
     - Global logout capability
   - Components:
     - AuthForm: Handles login, signup, and password reset requests
     - ResetPassword: Handles password reset confirmation
   - Security measures:
     - Uses getUser() for secure authentication checks
     - Proper session management with refresh tokens
     - Secure cookie handling
     - Minimum password length: 6 characters
     - Email verification required
     - Global session termination on password reset
   - Error handling:
     - Comprehensive error messages
     - Automatic cleanup on auth failures
     - Session refresh on expiration
   - UX improvements:
     - Loading states with disabled forms
     - Clear success/error feedback
     - Smooth navigation flows
     - Automatic redirects

6. **Layout** (`src/app/layout.tsx`)
   - Root layout with global styles and navigation
   - Responsive navigation bar with:
     - Library MVP branding
     - Books page link
     - Upload Book button
     - Authentication state display
   - Container for page content
   - Metadata configuration

7. **Upload Utility** (`src/lib/upload.ts`)
   - Handles file uploads to Supabase storage
   - Manages book metadata in database
   - Implements file naming conventions
   - Error handling and validation

8. **Supabase Client** (`src/lib/supabase.ts`)
   - Configured with environment variables
   - Ready for database operations and authentication

## Vector Database Integration

### Pinecone Integration

The project now uses Pinecone as the vector database for storing and searching book summaries. The integration is implemented in `src/lib/pinecone.ts` and includes the following key components:

#### Configuration
- Environment variables required in `.env.local`:
  ```
  PINECONE_API_KEY=your_api_key_here
  PINECONE_ENVIRONMENT=us-east-1-aws
  HUGGINGFACE_API_KEY=your_huggingface_api_key
  ```

#### Core Components

1. **Metadata Structure**
```typescript
interface BookMetadata {
  bookId: string
  title: string
  author: string
  chunkIndex: number
  text: string
}
```

2. **Main Functions**
- `initializeIndex()`: Initializes and verifies connection to Pinecone index
- `addDocumentChunks(bookId: string, chunks: { text: string; metadata: BookMetadata }[])`: Adds document chunks with embeddings
- `queryIndex(query: string)`: Searches for similar documents using semantic search
- `deleteBookEntries(bookId: string)`: Removes all vectors associated with a book

3. **Embedding Generation**
- Uses Hugging Face's `BAAI/bge-small-en-v1.5` model for generating embeddings
- 384-dimensional vectors for semantic similarity search

#### Usage Example

```typescript
// Initialize connection
await initializeIndex();

// Add document chunks
const chunks = [{
  text: "Chapter content...",
  metadata: {
    bookId: "book-123",
    title: "Book Title",
    author: "Author Name",
    chunkIndex: 0,
    text: "Chapter content..."
  }
}];
await addDocumentChunks("book-123", chunks);

// Query similar content
const results = await queryIndex("search query");

// Clean up
await deleteBookEntries("book-123");
```

#### Error Handling
- Comprehensive error handling for API key validation
- Connection error detection and reporting
- Detailed error messages for debugging

#### Testing
Two test scripts are provided:
1. `scripts/test-pinecone-direct.ts`: Tests direct Pinecone API connection
2. `scripts/test-pinecone-updated.ts`: Tests the full integration including embedding generation

To run tests:
```bash
npx ts-node scripts/test-pinecone-updated.ts
```

## Technical Setup

### Environment Variables
Required environment variables in `.env.local`:
```
# Pinecone Configuration
NEXT_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key
NEXT_PUBLIC_PINECONE_ENVIRONMENT=your_pinecone_environment

# Hugging Face Configuration
NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_huggingface_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_api_key
```

### Authentication Implementation
1. **Middleware Configuration** (`src/middleware.ts`)
   ```typescript
   // Secure authentication check
   const { data: { user }, error } = await supabase.auth.getUser();
   
   // Session refresh handling
   if (session?.expires_at && Date.now() / 1000 > session.expires_at) {
     const { data: { session: newSession } } = await supabase.auth.refreshSession();
     // Update session cookies...
   }
   ```

2. **Auth Form Implementation** (`src/components/auth/AuthForm.tsx`)
   ```typescript
   // Secure session handling during login
   if (data?.user) {
     await supabase.auth.setSession({
       access_token: data.session!.access_token,
       refresh_token: data.session!.refresh_token,
     });
   }
   ```

3. **Password Reset Flow** (`src/app/auth/reset-password/page.tsx`)
   ```typescript
   // Global sign out after password reset
   await supabase.auth.signOut({ scope: 'global' });
   ```

### Database Schema
```sql
-- Books table
CREATE TABLE books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX idx_books_created_at ON books(created_at);
CREATE INDEX idx_books_author ON books(author);
```

### Storage Configuration
- Bucket: 'books'
- Public access enabled for MVP
- File naming convention: `{sanitized-title}-{random-string}.{extension}`
- Storage policies configured for public access

### Dependencies
Core dependencies:
- `next`: 14.1.0
- `react`: 18.2.0
- `@supabase/supabase-js`: 2.39.3
- `@supabase/ssr`: Latest (for server-side Supabase operations)
- `chromadb`: 1.8.1 (to be utilized)

Development dependencies:
- TypeScript and type definitions
- Tailwind CSS and PostCSS
- ESLint for code quality

### Project Structure
```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Home page
│   ├── books/             # Books listing feature
│   │   └── page.tsx       # Books page component
│   ├── upload/            # Upload feature
│   │   └── page.tsx       # Upload page component
│   └── globals.css        # Global styles
├── components/            # Reusable React components
└── lib/                   # Utility functions and configurations
    ├── supabase.ts       # Supabase client
    ├── upload.ts         # Upload utilities
    └── chroma.ts         # ChromaDB client (to be implemented)
```

## Development Workflow

### Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run development server: `npm run dev`

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## Next Steps
1. Create vector search functionality with ChromaDB
2. Build chat interface for asking questions
3. Implement book deletion functionality

## Production Deployment

### ChromaDB Server Setup
The ChromaDB server is configured for production using Docker Compose and Nginx. The setup includes:

1. **Docker Compose Configuration** (`docker-compose.yml`)
   - ChromaDB service with security measures
   - Nginx reverse proxy with SSL support
   - Persistent volume for data storage
   - Health checks and logging configuration
   - Security options to prevent privilege escalation

2. **Nginx Configuration** (`nginx.conf`)
   - SSL/TLS support with modern cipher configuration
   - HTTP to HTTPS redirection
   - Security headers (HSTS, X-Frame-Options, etc.)
   - Proper proxy settings with timeouts
   - Connection pooling

3. **Authentication**
   - Basic authentication with secure credentials
   - Environment variable-based configuration
   - CORS configuration for frontend access

4. **Environment Variables**
   Required environment variables in `.env.production`:
   ```
   # ChromaDB Configuration
   CHROMA_SERVER_URL=https://chroma.library-mvp.com
   CHROMA_AUTH_USERNAME=admin
   CHROMA_AUTH_PASSWORD=<secure-password>
   CHROMA_CORS_ORIGINS=["https://library-mvp.com"]

   # Other configurations
   OPENROUTER_API_KEY=<your-key>
   NEXT_PUBLIC_SUPABASE_URL=<your-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
   HUGGINGFACE_API_KEY=<your-key>
   ```

### Deployment Process
1. Create the auth directory and credentials file:
   ```bash
   mkdir auth
   ```

2. Set up SSL certificates (using Let's Encrypt):
   ```bash
   mkdir -p ssl/live/chroma.library-mvp.com
   certbot certonly --standalone -d chroma.library-mvp.com
   ```

3. Start the services:
   ```bash
   docker-compose -f docker-compose.yml --env-file .env.production up -d
   ```

### Security Considerations
- All sensitive data is stored in environment variables
- SSL/TLS encryption for all communications
- Proper CORS configuration to restrict access
- Security headers to prevent common web vulnerabilities
- Container security measures to prevent privilege escalation
- Logging and monitoring configuration
- Regular security updates through Docker images

### Monitoring and Maintenance
- Health checks ensure service availability
- Log rotation prevents disk space issues
- Automatic container restart on failure
- Regular backup of persistent volume data
- Monitoring of resource usage and performance

### Upload Process
The upload process now includes the following steps:
1. **File Validation**
   - Checks for valid .txt files
   - Validates required fields (title, author)
   - Provides immediate feedback on validation errors

2. **File Processing**
   - Reads file content using `file.text()`
   - Chunks text into manageable segments
   - Preserves sentence boundaries during chunking
   - Generates unique IDs for each chunk

3. **Storage**
   - Uploads file to Supabase storage
   - Stores metadata in Supabase database
   - Generates embeddings using Hugging Face
   - Stores vectors in Pinecone

4. **User Feedback**
   - Shows progress indicators for each step
   - Displays clear error messages
   - Provides success confirmation
   - Redirects to books page on completion

### Error Handling
The application now includes comprehensive error handling:
1. **Client-Side**
   - Form validation errors
   - File type validation
   - Upload progress tracking
   - Clear error messages in UI

2. **Server-Side**
   - Environment variable validation
   - API connection errors
   - Storage/database errors
   - Vector processing errors

3. **Recovery**
   - Graceful error recovery
   - User-friendly error messages
   - Clear next steps for users
   - Proper cleanup on failures

### Vector Search Implementation
The vector search functionality uses Pinecone with the following configuration:
1. **Embedding Generation**
   - Model: BAAI/bge-small-en-v1.5
   - Vector size: 384 dimensions
   - Batch processing for efficiency

2. **Vector Storage**
   - Index name: book-summaries
   - Namespace: '' (default)
   - Metadata includes:
     - Book ID
     - Title
     - Author
     - Chunk index
     - Original text

3. **Query Process**
   - Generates query embedding
   - Performs similarity search
   - Returns top 5 matches
   - Includes metadata in results

### Usage
To upload a book summary:
1. Navigate to the upload page
2. Fill in the book title and author
3. Select a .txt file containing the summary
4. Submit the form
5. Wait for processing to complete
6. You will be redirected to the books page

To ask questions about a book:
1. Go to the books page
2. Click "Chat about this book" for your chosen book
3. Type your question in the chat interface
4. The system will:
   - Search for relevant passages using vector similarity
   - Generate a response using the AI model
   - Display the response in the chat

### Chat Functionality
The chat interface allows users to ask questions about their library and individual books. The implementation includes:

1. **Library-wide Chat** (`/chat`)
   - Users can ask questions about their entire library
   - System provides context-aware responses using relevant book content
   - Clickable book references link to specific book chats
   - Empty library state handling with appropriate messaging

2. **Single Book Chat** (`/chat/[bookId]`)
   - Users can ask questions about specific books
   - Responses are focused on the selected book's content
   - Proper validation of book existence
   - Context-aware responses using book-specific content

3. **Search and Context**
   - Uses Pinecone for semantic search across book content
   - Filters out deleted books and test data
   - Validates book metadata before including in responses
   - Proper handling of empty search results

4. **Error Handling**
   - Rate limiting for API requests
   - Proper error messages for API failures
   - Validation of API responses
   - Graceful handling of missing books
   - Authentication error handling

5. **Security**
   - Authentication required for all chat operations
   - Proper session validation
   - Secure handling of user data
   - Protected routes and API endpoints

### API Endpoints

1. **Chat API** (`/api/chat`)
   ```typescript
   POST /api/chat
   Body: {
     message: string;
     bookId?: string;  // Optional, for single book queries
     isLibraryQuery?: boolean;  // For library-wide queries
   }
   Response: {
     response: string;  // AI-generated response
   }
   ```

2. **Books API** (`/api/books`)
   ```typescript
   GET /api/books
   Response: {
     books: Array<{
       id: string;
       title: string;
       author: string;
       created_at: string;
     }>;
   }
   ```

### Environment Variables
Required environment variables for chat functionality:
```
# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Pinecone Configuration
NEXT_PUBLIC_PINECONE_API_KEY=your_pinecone_api_key
NEXT_PUBLIC_PINECONE_ENVIRONMENT=your_pinecone_environment

# Hugging Face Configuration
NEXT_PUBLIC_HUGGINGFACE_API_KEY=your_huggingface_api_key
```

### Rate Limiting
The chat API implements rate limiting to prevent abuse:
- 5 requests per minute per user
- Proper error messages for rate limit exceeded
- Automatic request counting and window management

### Error Handling
The application includes comprehensive error handling:
1. **API Errors**
   - Rate limit exceeded
   - Invalid API responses
   - Network failures
   - Authentication errors

2. **Data Validation**
   - Missing or invalid book data
   - Invalid search results
   - Missing metadata
   - Deleted book references

3. **User Feedback**
   - Clear error messages
   - Loading states
   - Empty state handling
   - Rate limit notifications

## Version Control

### GitHub Repository
The project is hosted on GitHub at [https://github.com/jakebgo/library-mvp](https://github.com/jakebgo/library-mvp).

#### Repository Structure
```
library-mvp/
├── src/                    # Source code
│   ├── app/               # Next.js app router pages
│   ├── components/        # React components
│   └── lib/              # Utility functions
├── scripts/              # Testing and setup scripts
├── auth/                 # Authentication credentials
├── ssl/                  # SSL certificates
├── supabase/            # Supabase configuration
└── chroma/              # ChromaDB data
```

#### Version Control Setup
1. **Git Configuration**
   - Main branch: `main`
   - Proper .gitignore configuration
   - Sensitive data excluded from version control

2. **Excluded Files**
   - Environment files (.env.local, .env.production)
   - Node modules
   - Build artifacts
   - SSL certificates
   - Auth credentials
   - ChromaDB data
   - IDE-specific files

3. **Development Workflow**
   - Clone the repository: `git clone https://github.com/jakebgo/library-mvp.git`
   - Install dependencies: `npm install`
   - Set up environment variables
   - Run development server: `npm run dev`

4. **Future Improvements**
   - GitHub Actions for CI/CD
   - Automated testing pipeline
   - Code quality checks
   - Automated deployment