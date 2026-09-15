'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, role } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  // Prevent flash of content before checking token
  if (!mounted || !token) {
    return (
      <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[14px] text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Basic role-based route guard
  if (pathname.startsWith('/dashboard/landlord') && role !== 'LANDLORD') {
    router.replace('/login');
    return null;
  }
  if (pathname.startsWith('/dashboard/tenant') && role !== 'TENANT') {
    router.replace('/login');
    return null;
  }
  if (pathname.startsWith('/dashboard/woreda') && role !== 'WOREDA_OFFICER') {
    router.replace('/login');
    return null;
  }
  if (pathname.startsWith('/dashboard/tax') && role !== 'TAX_OFFICER') {
    router.replace('/login');
    return null;
  }

  return <>{children}</>;
}
