import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TenantDashboard from '../page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock components
jest.mock('@/components/NavBar', () => () => <div data-testid="navbar" />);
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

describe('TenantDashboard', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();

    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<TenantDashboard />);
    expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
  });

  it('renders empty state when no contracts', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });
    
    expect(screen.getByText('No Contracts Yet')).toBeInTheDocument();
  });

  it('fetches contracts and renders registered, pending, and other states', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        results: [
          {
            id: '1',
            status: 'REGISTERED',
            contract_reg_number: 'REG-111',
            property_detail: { house_number: 'A1', building_type: 'VILLA' },
            monthly_rent_etb: 10000,
            advance_payment_etb: 5000,
            lease_duration_months: 12,
            lease_start_date: '2023-01-01',
            lease_end_date: '2024-01-01',
            landlord_detail: { full_name_en: 'Landlord One' },
            tenant_detail: { full_name_en: 'Tenant One' }
          },
          {
            id: '2',
            status: 'PENDING_TENANT_SIGNATURE',
            monthly_rent_etb: 5000,
            lease_duration_months: 6,
          },
          {
            id: '3',
            status: 'DRAFT',
            monthly_rent_etb: 2000,
            lease_duration_months: 1,
          }
        ]
      }
    });

    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    // Registered contract checks
    expect(screen.getByText('Contract #REG-111')).toBeInTheDocument();
    expect(screen.getByText('House #A1, VILLA')).toBeInTheDocument();
    expect(screen.getByText('ETB 10,000')).toBeInTheDocument();
    expect(screen.getAllByText('ETB 5,000').length).toBe(2);
    expect(screen.getByText('Landlord One')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2023')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    
    // Pending contract checks
    expect(screen.getAllByText('Contract #(Pending)').length).toBe(2);
    expect(screen.getAllByText('AWAITING YOUR SIGNATURE').length).toBe(2);
    expect(screen.getByText('Action Required: This contract is awaiting your digital signature. Check your review link.')).toBeInTheDocument();
    expect(screen.getByText('Review & Sign')).toBeInTheDocument();

    // Action buttons
    expect(screen.getByText('View Full Contract')).toBeInTheDocument();
    expect(screen.getByText('Download Contract')).toBeInTheDocument();
  });

  it('handles res.data with fallback to empty array when results is missing', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {}
    });

    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    expect(screen.getByText('No Contracts Yet')).toBeInTheDocument();
  });

  it('redirects to login on api error', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('error'));
    render(<TenantDashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('downloads contract with and without contract_reg_number', async () => {
    const contracts = {
      data: [
        {
          id: '10',
          status: 'SIGNED',
          contract_reg_number: 'REG-999',
          monthly_rent_etb: 10000,
          lease_duration_months: 12,
        },
        {
          id: '11',
          status: 'REGISTERED',
          monthly_rent_etb: 8000,
          lease_duration_months: 6,
        }
      ]
    };
    const pdfBlob = new Blob(['pdf']);
    (api.get as jest.Mock).mockImplementation((url: string) =>
      url.includes('/pdf/')
        ? Promise.resolve({ data: pdfBlob })
        : Promise.resolve(contracts)
    );

    render(<TenantDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    const downloadButtons = screen.getAllByText('Download Contract');
    expect(downloadButtons).toHaveLength(2);

    // Relative paths via the shared client — no hardcoded backend host.
    fireEvent.click(downloadButtons[0]);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/contracts/10/pdf/', { responseType: 'blob' });
    });

    fireEvent.click(downloadButtons[1]);
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/contracts/11/pdf/', { responseType: 'blob' });
    });

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(pdfBlob);
  });
});
