'use client';

import { useState, useEffect } from 'react';

interface DebugInfoProps {
  title: string;
  data?: unknown;
  error?: Error | string | null;
}

export default function DebugInfo({ title, data, error }: DebugInfoProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [timestamp] = useState(new Date().toISOString());

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group(`🐛 ${title} - ${timestamp}`);
      if (data) {
      }
      if (error) {
        console.error('Error:', error);
      }
      console.groupEnd();
    }
  }, [title, data, error, timestamp]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">{title}</h4>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-400 hover:text-white text-xs"
          >
            {showDetails ? 'Hide' : 'Show'}
          </button>
        </div>
        
        {showDetails && (
          <div className="text-xs space-y-2">
            <div>
              <strong>Timestamp:</strong> {timestamp}
            </div>
            
            {data && (
              <div>
                <strong>Data:</strong>
                <pre className="bg-gray-800 p-2 rounded mt-1 overflow-auto max-h-32 text-xs">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
            
            {error && (
              <div>
                <strong>Error:</strong>
                <pre className="bg-red-900 p-2 rounded mt-1 overflow-auto max-h-32 text-xs">
                  {error instanceof Error ? error.stack || error.message : String(error)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
