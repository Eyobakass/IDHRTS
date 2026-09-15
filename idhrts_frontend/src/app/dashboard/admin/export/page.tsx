'use client';
import NavBar from '@/components/NavBar';

export default function AdminExport() {
  const tables = [
    { id: 'users', name: 'Users' },
    { id: 'properties', name: 'Properties' },
    { id: 'contracts', name: 'Rental Contracts' },
    { id: 'tax_assessments', name: 'Tax Assessments' },
    { id: 'tax_payments', name: 'Tax Payments' },
    { id: 'disputes', name: 'Disputes' },
    { id: 'audit_logs', name: 'Audit Logs' },
    { id: 'notifications', name: 'Notifications' },
  ];

  const handleExport = (tableId: string) => {
    const token = localStorage.getItem('access_token');
    window.open(`http://127.0.0.1:8000/api/reports/export/${tableId}/?token=${token}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar portalName="Admin Portal" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Database Export</h1>
        <p className="text-gray-600 mb-8">Download full CSV backups of the system tables.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tables.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-lg shadow flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{t.name}</h3>
              <button 
                onClick={() => handleExport(t.id)}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
              >
                Download CSV
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
