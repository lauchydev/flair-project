'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPanelPage() {
  const router = useRouter();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      router.push('/login'); // redirect to login if not logged in
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Admin Panel</h1>
        <div className="space-y-4">
          <button
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
            onClick={() => console.log('Add Product clicked')}
          >
            Add Product
          </button>
          <button
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
            onClick={() => console.log('Remove Product clicked')}
          >
            Remove Product
          </button>
          <button
            className="w-full bg-black text-white py-2 rounded hover:bg-gray-800"
            onClick={() => console.log('Edit Available Product clicked')}
          >
            Edit Available Product
          </button>
        </div>
      </div>
    </div>
  );
}
