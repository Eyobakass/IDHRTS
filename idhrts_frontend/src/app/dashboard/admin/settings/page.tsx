'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import NavBar from '@/components/NavBar';

export default function AdminSettings() {
  const [configs, setConfigs] = useState<any[]>([]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const res = await api.get('/auth/system-config/');
      setConfigs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    try {
      await api.put('/auth/system-config/', { key, value });
      alert('Config updated successfully!');
      fetchConfigs();
    } catch (e) {
      alert('Failed to update config');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar portalName="Admin Portal" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">System Configurations</h1>
        
        <div className="grid gap-6">
          {configs.map(c => (
            <div key={c.key} className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">{c.key}</h3>
              <p className="text-sm text-gray-500 mb-4">{c.description}</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <textarea 
                  className="flex-1 border border-gray-300 rounded p-2 text-sm font-mono"
                  rows={4}
                  defaultValue={c.value}
                  id={`config-${c.key}`}
                />
                <button 
                  onClick={() => {
                    const val = (document.getElementById(`config-${c.key}`) as HTMLTextAreaElement).value;
                    handleUpdate(c.key, val);
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded sm:self-start w-full sm:w-auto"
                >
                  Save
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
