import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import TaxDashboard from '../page';
import { api } from '@/lib/api';

// Mock components
jest.mock('@/components/NavBar', () => () => <div data-testid="navbar" />);
jest.mock('@/components/StatCard', () => ({ label, value }: any) => <div data-testid="stat-card">{label}: {value}</div>);
jest.mock('@/components/StatusBadge', () => ({ status }: any) => <div data-testid="status-badge">{status}</div>);
jest.mock('@/components/EmptyState', () => ({ title }: any) => <div data-testid="empty-state">{title}</div>);

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('TaxDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
    global.open = jest.fn();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('renders loading initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<TaxDashboard />);
    expect(screen.getByText('Loading assessments...')).toBeInTheDocument();
  });

  it('renders empty state if no assessments', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading assessments...')).not.toBeInTheDocument();
    });
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('fetches and renders assessments', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        results: [
          {
            id: '1',
            property: { house_number: '100' },
            landlord: { full_name_en: 'John Doe' },
            fiscal_year: '2023',
            tax_due_etb: 500.5,
            status: 'PENDING'
          },
          {
            id: '2',
            status: 'PAID'
          }
        ]
      }
    });

    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading assessments...')).not.toBeInTheDocument();
    });

    // Verify stats
    expect(screen.getAllByTestId('stat-card')[0]).toHaveTextContent('Total Assessments: 2');
    expect(screen.getAllByTestId('stat-card')[1]).toHaveTextContent('Pending Payment: 1');
    expect(screen.getAllByTestId('stat-card')[2]).toHaveTextContent('Paid: 1');

    // Verify table rows
    expect(screen.getByText('Sample: Property 100')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('500.50')).toBeInTheDocument();
  });

  it('downloads SIGTAS report successfully', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/tax/') return Promise.resolve({ data: [] });
      if (url === '/reports/sigtas/') return Promise.resolve({ data: new Blob(['csv']) });
      return Promise.reject();
    });

    render(<TaxDashboard />);

    const downloadBtn = screen.getByText('Download SIGTAS CSV');
    fireEvent.click(downloadBtn);

    expect(screen.getByText('Downloading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SIGTAS CSV downloaded successfully.')).toBeInTheDocument();
    });

    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('shows error toast when SIGTAS download fails', async () => {
    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/tax/') return Promise.resolve({ data: [] });
      if (url === '/reports/sigtas/') return Promise.reject(new Error('error'));
      return Promise.resolve();
    });

    render(<TaxDashboard />);
    fireEvent.click(screen.getByText('Download SIGTAS CSV'));

    await waitFor(() => {
      expect(screen.getByText('Failed to download SIGTAS CSV.')).toBeInTheDocument();
    });
  });

  it('initializes chapa payment successfully with url', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: [{ id: '1', status: 'PENDING' }]
    });

    (api.post as jest.Mock).mockResolvedValue({
      data: { checkout_url: 'http://chapa.co/pay' }
    });

    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pay'));
    expect(screen.getByText('Processing...')).toBeInTheDocument();

    await waitFor(() => {
      expect(global.open).toHaveBeenCalledWith('http://chapa.co/pay', '_blank');
    });
  });

  it('initializes chapa payment successfully without url', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: [{ id: '1', status: 'PROCESSING' }]
    });

    (api.post as jest.Mock).mockResolvedValue({
      data: {}
    });

    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pay'));

    await waitFor(() => {
      expect(screen.getByText('Payment initialized successfully.')).toBeInTheDocument();
    });
  });

  it('shows error if payment initialization fails', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: [{ id: '1', status: 'PENDING' }]
    });

    (api.post as jest.Mock).mockRejectedValue(new Error('fail'));

    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pay'));

    await waitFor(() => {
      expect(screen.getByText('Failed to initialize payment.')).toBeInTheDocument();
    });
  });

  it('toast message disappears after timeout', async () => {
    jest.useFakeTimers();

    (api.get as jest.Mock).mockImplementation((url: string) => {
      if (url === '/tax/') return Promise.resolve({ data: [] });
      if (url === '/reports/sigtas/') return Promise.reject(new Error('error'));
      return Promise.resolve();
    });

    render(<TaxDashboard />);
    fireEvent.click(screen.getByText('Download SIGTAS CSV'));

    await waitFor(() => {
      expect(screen.getByText('Failed to download SIGTAS CSV.')).toBeInTheDocument();
    });

    act(() => {
      jest.advanceTimersByTime(4000);
    });

    await waitFor(() => {
      expect(screen.queryByText('Failed to download SIGTAS CSV.')).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  it('handles api.get failure and fallback gracefully', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('error'));
    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading assessments...')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('handles res.data fallback when results is missing', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: {} });
    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Loading assessments...')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('does not trigger payment when clicking pay on a non-pending/processing assessment', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: [{ id: '1', status: 'PAID' }]
    });

    render(<TaxDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Pay')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Pay'));
    expect(api.post).not.toHaveBeenCalled();
  });
});
