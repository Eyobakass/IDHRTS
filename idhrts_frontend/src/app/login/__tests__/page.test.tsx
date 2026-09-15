import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockChangeLanguage = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

// We must also mock the actual i18n import that is being used for side effects
jest.mock('@/lib/i18n', () => ({}));

describe('LoginPage', () => {
  let mockPush: jest.Mock;
  let mockSetAuth: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    mockSetAuth = jest.fn();
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      return selector({ setAuth: mockSetAuth });
    });

    (useTranslation as jest.Mock).mockReturnValue({
      i18n: {
        language: 'en',
        changeLanguage: mockChangeLanguage,
      },
    });

    jest.clearAllMocks();
  });

  it('renders login form correctly with en active', () => {
    render(<LoginPage />);
    expect(screen.getByText('IDHRTS')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0);
  });

  it('renders language toggle with am active and toggles language', () => {
    (useTranslation as jest.Mock).mockReturnValue({
      i18n: {
        language: 'am',
        changeLanguage: mockChangeLanguage,
      },
    });

    render(<LoginPage />);
    const enButton = screen.getByText('English');
    const amButton = screen.getByText('አማርኛ');

    fireEvent.click(enButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');

    fireEvent.click(amButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('am');
  });

  it('handles successful login for LANDLORD', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access: 'token123', role: 'LANDLORD' },
    });

    render(<LoginPage />);
    const phoneInput = screen.getByPlaceholderText('+251 9__ ___-___');
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(phoneInput, { target: { value: '0911111111' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith('token123', 'LANDLORD');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/landlord');
    });
  });

  it('handles successful login for TENANT', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access: 'token123', role: 'TENANT' },
    });

    render(<LoginPage />);
    const phoneInput = screen.getByPlaceholderText('+251 9__ ___-___');
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(phoneInput, { target: { value: '0911111111' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/tenant');
    });
  });

  it('handles successful login for WOREDA_OFFICER', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access: 'token123', role: 'WOREDA_OFFICER' },
    });

    render(<LoginPage />);
    const phoneInput = screen.getByPlaceholderText('+251 9__ ___-___');
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(phoneInput, { target: { value: '0911111111' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/woreda');
    });
  });

  it('handles successful login for TAX_OFFICER', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access: 'token123', role: 'TAX_OFFICER' },
    });

    render(<LoginPage />);
    const phoneInput = screen.getByPlaceholderText('+251 9__ ___-___');
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(phoneInput, { target: { value: '0911111111' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/tax');
    });
  });

  it('handles login with unknown role', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      data: { access: 'token123', role: 'UNKNOWN_ROLE' },
    });

    render(<LoginPage />);
    const phoneInput = screen.getByPlaceholderText('+251 9__ ___-___');
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(phoneInput, { target: { value: '0911111111' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith('token123', 'UNKNOWN_ROLE');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  it('shows error on login failure and shows loading state during submit', async () => {
    let resolvePromise: (value: any) => void;
    (api.post as jest.Mock).mockImplementation(() => new Promise((resolve, reject) => {
      resolvePromise = reject;
    }));

    render(<LoginPage />);
    const phoneInput = screen.getByPlaceholderText('+251 9__ ___-___');
    const pinInput = screen.getByPlaceholderText('••••');
    fireEvent.change(phoneInput, { target: { value: '0911111111' } });
    fireEvent.change(pinInput, { target: { value: '0000' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Signing in...')).toBeInTheDocument();

    resolvePromise!(new Error('Invalid credentials'));

    await waitFor(() => {
      expect(screen.getByText('Invalid phone number or PIN')).toBeInTheDocument();
    });
  });
});
