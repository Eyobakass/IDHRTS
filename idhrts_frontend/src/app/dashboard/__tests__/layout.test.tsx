import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from '../layout';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('DashboardLayout', () => {
  let mockReplace: jest.Mock;

  beforeEach(() => {
    mockReplace = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ replace: mockReplace });
    jest.clearAllMocks();
  });

  it('redirects to login when token is missing', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: null, role: null });
    (usePathname as jest.Mock).mockReturnValue('/dashboard/landlord');

    render(
      <DashboardLayout>
        <div>Protected Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows LANDLORD on /dashboard/landlord and blocks non-landlord', async () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'LANDLORD' });
    (usePathname as jest.Mock).mockReturnValue('/dashboard/landlord');

    const { rerender } = render(
      <DashboardLayout>
        <div>Landlord Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Landlord Content')).toBeInTheDocument();

    // Wrong role
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'TENANT' });
    rerender(
      <DashboardLayout>
        <div>Landlord Content</div>
      </DashboardLayout>
    );

    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Landlord Content')).not.toBeInTheDocument();
  });

  it('allows TENANT on /dashboard/tenant and blocks non-tenant', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'TENANT' });
    (usePathname as jest.Mock).mockReturnValue('/dashboard/tenant');

    const { rerender } = render(
      <DashboardLayout>
        <div>Tenant Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Tenant Content')).toBeInTheDocument();

    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'LANDLORD' });
    rerender(
      <DashboardLayout>
        <div>Tenant Content</div>
      </DashboardLayout>
    );

    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Tenant Content')).not.toBeInTheDocument();
  });

  it('allows WOREDA_OFFICER on /dashboard/woreda and blocks non-woreda', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'WOREDA_OFFICER' });
    (usePathname as jest.Mock).mockReturnValue('/dashboard/woreda');

    const { rerender } = render(
      <DashboardLayout>
        <div>Woreda Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Woreda Content')).toBeInTheDocument();

    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'TENANT' });
    rerender(
      <DashboardLayout>
        <div>Woreda Content</div>
      </DashboardLayout>
    );

    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Woreda Content')).not.toBeInTheDocument();
  });

  it('allows TAX_OFFICER on /dashboard/tax and blocks non-tax', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'TAX_OFFICER' });
    (usePathname as jest.Mock).mockReturnValue('/dashboard/tax');

    const { rerender } = render(
      <DashboardLayout>
        <div>Tax Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Tax Content')).toBeInTheDocument();

    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'TENANT' });
    rerender(
      <DashboardLayout>
        <div>Tax Content</div>
      </DashboardLayout>
    );

    expect(mockReplace).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Tax Content')).not.toBeInTheDocument();
  });

  it('allows any authenticated user on other dashboard routes like /dashboard/disputes', () => {
    (useAuthStore as unknown as jest.Mock).mockReturnValue({ token: 'tok1', role: 'TENANT' });
    (usePathname as jest.Mock).mockReturnValue('/dashboard/disputes');

    render(
      <DashboardLayout>
        <div>Disputes Content</div>
      </DashboardLayout>
    );

    expect(screen.getByText('Disputes Content')).toBeInTheDocument();
  });
});
