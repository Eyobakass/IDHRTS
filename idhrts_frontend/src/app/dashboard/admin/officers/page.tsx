'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import NavBar from '@/components/NavBar';

export default function AdminOfficers() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [phone, setPhone] = useState('');
  const [fullNameEn, setFullNameEn] = useState('');
  const [fullNameAm, setFullNameAm] = useState('');
  const [role, setRole] = useState('WOREDA_OFFICER');
  
  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = async () => {
    try {
      const res = await api.get('/auth/officers/');
      setOfficers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/officers/create/', {
        phone_number: phone,
        full_name_en: fullNameEn,
        full_name_am: fullNameAm,
        role: role
      });
      alert('Officer created successfully. Temp PIN sent via SMS.');
      setPhone(''); setFullNameEn(''); setFullNameAm('');
      fetchOfficers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create officer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar portalName="Admin Portal" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Manage Officers</h1>
        
        {/* Create Form */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-lg font-medium mb-4">Register New Officer</h2>
          <form className="grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={handleCreate}>
            <input required placeholder="Phone Number" value={phone} onChange={e=>setPhone(e.target.value)} className="border p-2 rounded w-full" />
            <input required placeholder="Full Name (EN)" value={fullNameEn} onChange={e=>setFullNameEn(e.target.value)} className="border p-2 rounded" />
            <input required placeholder="Full Name (AM)" value={fullNameAm} onChange={e=>setFullNameAm(e.target.value)} className="border p-2 rounded" />
            <select value={role} onChange={e=>setRole(e.target.value)} className="border p-2 rounded">
              <option value="WOREDA_OFFICER">Woreda Officer</option>
              <option value="TAX_OFFICER">Tax Officer</option>
            </select>
            <button type="submit" className="bg-blue-600 text-white p-2 rounded col-span-full">Create Officer</button>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Role</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officers.map(o => (
                <tr key={o.id}>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm">{o.full_name_en}</td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm">{o.role}</td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm">{o.phone_number}</td>
                  <td className="px-3 sm:px-6 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${o.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {o.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
