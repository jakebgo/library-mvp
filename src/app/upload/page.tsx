'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadBookSummary } from '@/lib/upload';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      setError('No file selected');
      return;
    }

    if (selectedFile.type === 'text/plain') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid text file (.txt)');
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !author) {
      setError('Please fill in all fields and select a file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setProgress('Starting upload...');

    try {
      setProgress('Uploading file...');
      await uploadBookSummary(file, title, author);
      setProgress('Upload complete! Redirecting...');
      setTimeout(() => {
        router.push('/books');
        router.refresh();
      }, 1000);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload Book Summary</h1>
      
      <form onSubmit={handleSubmit} className="max-w-md space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Book Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isUploading}
            required
          />
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700">
            Author
          </label>
          <input
            type="text"
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            disabled={isUploading}
            required
          />
        </div>

        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700">
            Summary File (TXT)
          </label>
          <input
            type="file"
            id="file"
            accept=".txt"
            onChange={handleFileChange}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
            disabled={isUploading}
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            Only .txt files are supported
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {progress && !error && (
          <div className="bg-blue-50 text-blue-600 p-3 rounded-md text-sm">
            {progress}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !file || !title || !author}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Summary'}
        </button>
      </form>
    </div>
  );
} 