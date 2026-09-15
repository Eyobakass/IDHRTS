import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import DisputesDashboard from '../page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock components
jest.mock('@/components/NavBar', () => () => <div data-testid="navbar" />);
jest.mock('@/components/EmptyState', () => ({ title }: any) => <div data-testid="empty-state">{title}</div>);
jest.mock('@/components/SkeletonCard', () => () => <div data-testid="skeleton-card" />);
jest.mock('@/components/StatusBadge', () => ({ status }: any) => <div data-testid="status-badge">{status}</div>);

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('DisputesDashboard', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it('renders loading skeleton initially', () => {
    (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<DisputesDashboard />);
    expect(screen.getAllByTestId('skeleton-card').length).toBeGreaterThan(0);
  });

  it('renders empty state when no disputes', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    expect(screen.getByText('No Disputes')).toBeInTheDocument();
  });

  it('fetches and displays disputes list', async () => {
    (api.get as jest.Mock).mockResolvedValue({
      data: {
        results: [
          {
            id: '1',
            title: 'Unfair Rent Hike',
            description: 'Landlord increased rent illegally by 50%',
            status: 'PENDING',
            filed_at: '2023-08-01',
          },
          {
            id: '2',
            description: 'Broken water pipe ignored',
            status: 'RESOLVED',
          }
        ]
      }
    });

    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    expect(screen.getByText('Unfair Rent Hike')).toBeInTheDocument();
    expect(screen.getByText('Landlord increased rent illegally by 50%')).toBeInTheDocument();
    expect(screen.getByText('Untitled Dispute')).toBeInTheDocument();
    expect(screen.getByText('Broken water pipe ignored')).toBeInTheDocument();
  });

  it('redirects to login on fetch failure', async () => {
    (api.get as jest.Mock).mockRejectedValue(new Error('Auth failed'));
    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('opens modal, files a dispute successfully and refetches', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockResolvedValue({ data: { id: '10' } });

    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /file new dispute/i }));
    expect(screen.getByRole('heading', { name: 'File a Dispute' })).toBeInTheDocument();

    // Fill form
    const titleInput = screen.getByPlaceholderText('Brief title of the issue');
    const descInput = screen.getByPlaceholderText('Provide full details about the dispute...');

    fireEvent.change(titleInput, { target: { value: 'Water Leaking' } });
    fireEvent.change(descInput, { target: { value: 'Pipe has been leaking for two weeks' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Dispute' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/disputes/', {
        title: 'Water Leaking',
        description: 'Pipe has been leaking for two weeks',
      });
      expect(screen.getByText('Dispute filed successfully.')).toBeInTheDocument();
    });
  });

  it('handles dispute submission error', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    (api.post as jest.Mock).mockRejectedValue(new Error('Submit failed'));

    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /file new dispute/i }));

    const titleInput = screen.getByPlaceholderText('Brief title of the issue');
    const descInput = screen.getByPlaceholderText('Provide full details about the dispute...');

    fireEvent.change(titleInput, { target: { value: 'Water Leaking' } });
    fireEvent.change(descInput, { target: { value: 'Pipe has been leaking' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Dispute' }));

    await waitFor(() => {
      expect(screen.getByText('Failed to file dispute.')).toBeInTheDocument();
    });
  });

  it('handles cancel in modal', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: [] });
    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /file new dispute/i }));
    expect(screen.getByRole('heading', { name: 'File a Dispute' })).toBeInTheDocument();

    // Click backdrop
    const backdrop = document.querySelector('.bg-black\\/40');
    if (backdrop) fireEvent.click(backdrop);
    expect(screen.queryByPlaceholderText('Brief title of the issue')).not.toBeInTheDocument();

    // Reopen and click Cancel button
    fireEvent.click(screen.getByRole('button', { name: /file new dispute/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByPlaceholderText('Brief title of the issue')).not.toBeInTheDocument();
  });

  it('handles empty description prevent submit and empty array fallback', async () => {
    (api.get as jest.Mock).mockResolvedValue({ data: {} });
    render(<DisputesDashboard />);

    await waitFor(() => {
      expect(screen.queryAllByTestId('skeleton-card')).toHaveLength(0);
    });

    fireEvent.click(screen.getByRole('button', { name: /file new dispute/i }));
    
    // Attempt submit with empty description
    const form = screen.getByRole('heading', { name: 'File a Dispute' }).closest('div')!.parentElement!.querySelector('form')!;
    fireEvent.submit(form);
    expect(api.post).not.toHaveBeenCalled();
  });
});
