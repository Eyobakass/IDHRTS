import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import SignContract from '@/app/review/[token]/page';
import { api } from '@/lib/api';
import { useRouter, useParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

describe('Contract Review Page', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    (useParams as jest.Mock).mockReturnValue({ token: 'secure_test_token' });
  });

  it('shows loading state initially', () => {
    (api.get as jest.Mock).mockReturnValue(new Promise(() => {}));
    render(<SignContract />);
    expect(screen.getByText('Loading contract...')).toBeInTheDocument();
  });

  it('shows error state on invalid or expired token', async () => {
    (api.get as jest.Mock).mockRejectedValueOnce(new Error('Invalid token'));
    render(<SignContract />);
    await waitFor(() => {
      expect(screen.getByText('Invalid Contract Link')).toBeInTheDocument();
    });
  });

  it('renders valid contract details successfully', async () => {
    const mockContract = {
      monthly_rent_etb: 5500,
      advance_payment_etb: 11000,
      lease_duration_months: 24,
      status: 'PENDING_TENANT_SIGNATURE'
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockContract });
    render(<SignContract />);
    await waitFor(() => {
      expect(screen.getByText('ETB 5,500')).toBeInTheDocument();
      expect(screen.getByText('24 months')).toBeInTheDocument();
      expect(screen.getByText('PENDING YOUR SIGNATURE')).toBeInTheDocument();
    });
  });

  it('sign button is disabled until checkbox is checked', async () => {
    const mockContract = {
      monthly_rent_etb: 5500,
      lease_duration_months: 24,
      status: 'PENDING_TENANT_SIGNATURE'
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockContract });
    render(<SignContract />);
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
    const signButton = screen.getByRole('button', { name: /I Agree/i });
    expect(signButton).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(signButton).not.toBeDisabled();
  });

  it('handles successful signature and shows success state', async () => {
    const mockContract = {
      monthly_rent_etb: 5500,
      lease_duration_months: 24,
      status: 'PENDING_TENANT_SIGNATURE'
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockContract });
    (api.post as jest.Mock).mockResolvedValueOnce({}); // request-otp
    (api.post as jest.Mock).mockResolvedValueOnce({}); // sign
    render(<SignContract />);
    await waitFor(() => {
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /I Agree/i }));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('••••••')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('••••••'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify & Sign' }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/contracts/public/review/secure_test_token/sign/', { otp: '123456' });
      expect(screen.getByText('Contract Signed Successfully')).toBeInTheDocument();
    });
  });

  it('shows already-signed state when contract is not pending signature', async () => {
    const mockContract = {
      monthly_rent_etb: 5500,
      lease_duration_months: 24,
      status: 'REGISTERED'
    };
    (api.get as jest.Mock).mockResolvedValueOnce({ data: mockContract });
    render(<SignContract />);
    await waitFor(() => {
      expect(screen.getByText('Contract Already Signed')).toBeInTheDocument();
    });
  });
});
