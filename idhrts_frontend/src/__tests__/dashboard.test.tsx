import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LandlordDashboard from '@/app/dashboard/landlord/page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

describe('Landlord Dashboard', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    useAuthStore.setState({ token: 'fake_token', role: 'LANDLORD' });
  });

  it('renders properties successfully when API resolves', async () => {
    const mockProperties = [
      { id: 1, house_number: '10A', monthly_rent_etb: '5000', kebele: '01', status: 'ACTIVE' },
      { id: 2, house_number: '20B', monthly_rent_etb: '8000', kebele: '02', status: 'PENDING_REVIEW' }
    ];
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') return Promise.resolve({ data: mockProperties });
      if (url === '/contracts/') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });

    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(screen.getByText('House #10A')).toBeInTheDocument();
      expect(screen.getByText(/ETB 5[,.]?000/)).toBeInTheDocument();
      expect(screen.getByText('House #20B')).toBeInTheDocument();
    });
  });

  it('renders empty state correctly when no properties exist', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') return Promise.resolve({ data: [] });
      if (url === '/contracts/') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });
    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/No Properties Yet/i)).toBeInTheDocument();
    });
  });

  it('redirects to login on API error (unauthorized handling)', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Unauthorized'));
    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/login');
    });
  });

  it('handles logout by clearing store and redirecting', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') return Promise.resolve({ data: [] });
      if (url === '/contracts/') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });
    render(<LandlordDashboard />);
    
    // Wait for the initial load
    await waitFor(() => {
        expect(screen.getByText(/No Properties Yet/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutButton);

    expect(useAuthStore.getState().token).toBeNull();
    expect(pushMock).toHaveBeenCalledWith('/login');
  });
});

