import React, { useState } from 'react';

function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadEndpoint, setUploadEndpoint] = useState<'test' | 'teacher' | 'simple'>('simple');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Please select a file first');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Create form data
      const formData = new FormData();
      
      // Always use 'file' as the field name for the simple endpoint
      formData.append('file', file);

      console.log('Uploading file:', file.name, 'Size:', file.size, 'MIME:', file.type);
      
      // Determine which endpoint to use
      let endpoint = '/api/test-upload';
      if (uploadEndpoint === 'teacher') {
        endpoint = '/api/teacher/upload';
      } else if (uploadEndpoint === 'simple') {
        endpoint = '/api/simple-upload';
      }
      
      console.log('Using endpoint:', endpoint);

      // Send to server with proper headers for multipart form data
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header for multipart/form-data
        // Let the browser set it automatically with the correct boundary
      });

      console.log('Response status:', res.status);
      
      if (res.ok) {
        try {
          const data = await res.json();
          console.log('Upload success:', data);
          setResponse(data);
        } catch (jsonError) {
          console.error('Failed to parse response:', jsonError);
          
          try {
            // Try to get the response as text if JSON parsing fails
            const text = await res.text();
            console.log('Raw response text:', text);
            
            if (text.trim().startsWith('<')) {
              // This is likely HTML content, not JSON
              setError('Server returned HTML instead of JSON');
              setResponse({ raw: text });
            } else {
              setError('Failed to parse server response as JSON');
              setResponse({ raw: text });
            }
          } catch (textError) {
            setError('Failed to read server response');
          }
        }
      } else {
        console.error('Upload failed with status:', res.status);
        setError(`Upload failed with status: ${res.status}`);
        
        try {
          const errorData = await res.text();
          setResponse({ error: errorData });
        } catch (e) {
          setResponse({ error: 'Could not read error response' });
        }
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto mt-10 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Test File Upload</h1>

      <div className="mb-4">
        <div className="font-medium mb-2">Select endpoint:</div>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              checked={uploadEndpoint === 'simple'}
              onChange={() => setUploadEndpoint('simple')}
              className="mr-2"
            />
            Simple upload (recommended, bypasses complex logic)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={uploadEndpoint === 'test'}
              onChange={() => setUploadEndpoint('test')}
              className="mr-2"
            />
            Test upload endpoint (no authentication)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={uploadEndpoint === 'teacher'}
              onChange={() => setUploadEndpoint('teacher')}
              className="mr-2"
            />
            Teacher upload endpoint (requires authentication)
          </label>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select a file:</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.txt,.doc,.docx"
            className="block w-full border border-gray-300 rounded py-2 px-3"
          />
          <div className="mt-2 text-xs text-gray-500">
            Supported file types: .pdf, .txt, .doc, .docx
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !file}
          className={`w-full py-2 px-4 rounded ${
            isLoading
              ? 'bg-gray-400'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Server Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-64 text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>

          {response.preview && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Content Preview:</h3>
              <div className="bg-gray-50 border p-3 rounded text-sm whitespace-pre-wrap">
                {response.preview}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TestUpload; 