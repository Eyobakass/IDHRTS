'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import NavBar from '@/components/NavBar';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/auth/audit-logs/');
      setLogs(Array.isArray(res.data) ? res.data : res.data.results ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar portalName="Admin Portal" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">System Audit Logs</h1>
        
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Action</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actor Role</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Target Type</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">No logs found.</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{log.action}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">{log.actor_role || 'SYSTEM'}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">{log.target_type}</td>
                    <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm text-gray-500">{log.ip_address}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
