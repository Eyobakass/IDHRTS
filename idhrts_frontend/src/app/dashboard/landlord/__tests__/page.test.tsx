import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import LandlordDashboard from '../page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock components to simplify tests
jest.mock('@/components/NavBar', () => () => <div data-testid="navbar" />);
jest.mock('@/components/PropertyCard', () => ({ property }: any) => <div data-testid="property-card">{property.id}</div>);
jest.mock('@/components/StatCard', () => ({ label, value }: any) => <div data-testid="stat-card">{label}: {value}</div>);
jest.mock('@/components/EmptyState', () => ({ title }: any) => <div data-testid="empty-state">{title}</div>);
jest.mock('@/components/SkeletonCard', () => () => <div data-testid="skeleton-card" />);

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('LandlordDashboard', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();

    // Mock URL for download test
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<LandlordDashboard />);
    expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
  });

  it('fetches properties and contracts and renders them', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') {
        return Promise.resolve({
          data: {
            results: [
              { id: 1, status: 'ACTIVE' },
              { id: 2, status: 'PENDING_REVIEW' },
              { id: 3, status: 'REJECTED' },
            ]
          }
        });
      }
      if (url === '/contracts/') {
        return Promise.resolve({
          data: [
            { id: 101, status: 'REGISTERED', contract_reg_number: 'REG-123', tenant_detail: { full_name_en: 'John Doe' }, monthly_rent_etb: 5000 },
            { id: 102, status: 'PENDING', tenant_detail: null, monthly_rent_etb: 2000 }
          ]
        });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    // Stats
    expect(screen.getAllByTestId('stat-card')[0]).toHaveTextContent('Total Properties: 3');
    expect(screen.getAllByTestId('stat-card')[1]).toHaveTextContent('Rejected: 1');
    expect(screen.getAllByTestId('stat-card')[2]).toHaveTextContent('Active: 1');
    expect(screen.getAllByTestId('stat-card')[3]).toHaveTextContent('Pending Review: 1');

    // Properties
    expect(screen.getAllByTestId('property-card')).toHaveLength(3);

    // Contracts
    expect(screen.getByText('Contract #REG-123')).toBeInTheDocument();
    expect(screen.getByText('Pending Contract')).toBeInTheDocument();
    expect(screen.getByText('Tenant: John Doe')).toBeInTheDocument();
    expect(screen.getByText('Tenant: Unknown')).toBeInTheDocument();
  });

  it('renders empty states when no properties or contracts', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') return Promise.resolve({ data: [] });
      if (url === '/contracts/') return Promise.resolve({ data: [] });
      return Promise.reject(new Error('not found'));
    });

    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    expect(screen.getByText('No Properties Yet')).toBeInTheDocument();
    expect(screen.getByText('No Contracts')).toBeInTheDocument();
  });

  it('redirects to login on properties fetch failure', async () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') return Promise.reject(new Error('Unauthorized'));
      if (url === '/contracts/') return Promise.reject(new Error('Unauthorized'));
      return Promise.reject(new Error('not found'));
    });

    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    consoleSpy.mockRestore();
  });

  it('downloads contract through the api client when button is clicked', async () => {
    const pdfBlob = new Blob(['pdf content']);
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') return Promise.resolve({ data: [] });
      if (url === '/contracts/') {
        return Promise.resolve({
          data: [
            { id: 101, status: 'REGISTERED', contract_reg_number: 'REG-123', tenant_detail: { full_name_en: 'John Doe' }, monthly_rent_etb: 5000 }
          ]
        });
      }
      if (url === '/contracts/101/pdf/') return Promise.resolve({ data: pdfBlob });
      return Promise.reject(new Error('not found'));
    });

    render(<LandlordDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    const downloadBtn = screen.getByText('Download Contract');
    fireEvent.click(downloadBtn);

    // Relative path via the shared client — no hardcoded backend host.
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/contracts/101/pdf/', { responseType: 'blob' });
    });
    await waitFor(() => {
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
    });
  });
});
