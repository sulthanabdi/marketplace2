'use client';

import { useState } from 'react';

export default function FixUserButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFixUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/fix-user', {
        method: 'POST',
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessage(data.message);
    } catch (error) {
      console.error('Error fixing user:', error);
      setMessage('Failed to fix user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleFixUser}
        disabled={loading}
        className="w-full bg-primary text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Fix User Data'}
      </button>
      
      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
} 