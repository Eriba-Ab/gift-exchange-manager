/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import UserDraw from './components/UserDraw';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowAdmin(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-md space-y-8">
        {showAdmin ? (
          <AdminPanel />
        ) : (
          <UserDraw />
        )}
      </div>
    </div>
  );
}

