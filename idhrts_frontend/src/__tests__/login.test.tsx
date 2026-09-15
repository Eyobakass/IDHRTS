import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

// Mock react-i18next
const changeLanguageMock = jest.fn();
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: changeLanguageMock,
    },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() }
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock api
jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

describe('LoginPage', () => {
  const pushMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: pushMock });
    useAuthStore.setState({ token: null, role: null });
  });

  const submitForm = () => {
    fireEvent.submit(document.querySelector('form')!);
  };

  it('renders login form with phone and PIN fields', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('+251 9__ ___-___')).toBeInTheDocument();
    expect(screen.getByText('Phone Number')).toBeInTheDocument();
    expect(screen.getByText('4-Digit PIN')).toBeInTheDocument();
  });

  it('shows error message on API failure', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    render(<LoginPage />);
    submitForm();
    await waitFor(() => {
      expect(screen.getByText('Invalid phone number or PIN')).toBeInTheDocument();
    });
  });

  it('calls setAuth and redirects LANDLORD to correct dashboard on success', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { access: 'token123', role: 'LANDLORD' }
    });
    const { container } = render(<LoginPage />);

    fireEvent.change(screen.getByPlaceholderText('+251 9__ ___-___'), { target: { value: '0911223344' } });
    const pinInput = container.querySelector('input[type="password"]');
    if (pinInput) {
      fireEvent.change(pinInput, { target: { value: '1234' } });
    }

    submitForm();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login/', { phone_number: '0911223344', pin: '1234' });
      expect(pushMock).toHaveBeenCalledWith('/dashboard/landlord');
    });
    
    expect(useAuthStore.getState().token).toBe('token123');
    expect(useAuthStore.getState().role).toBe('LANDLORD');
  });

  it('calls setAuth and redirects TENANT to correct dashboard', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { access: 'token123', role: 'TENANT' }
    });
    render(<LoginPage />);
    submitForm();
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/tenant');
    });
  });

  it('calls setAuth and redirects WOREDA_OFFICER to correct dashboard', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { access: 'token123', role: 'WOREDA_OFFICER' }
    });
    render(<LoginPage />);
    submitForm();
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/woreda');
    });
  });

  it('calls setAuth and redirects TAX_OFFICER to correct dashboard', async () => {
    (api.post as jest.Mock).mockResolvedValueOnce({
      data: { access: 'token123', role: 'TAX_OFFICER' }
    });
    render(<LoginPage />);
    submitForm();
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard/tax');
    });
  });

  it('language toggle button is present', () => {
    render(<LoginPage />);
    const toggleBtn = screen.getByText('አማርኛ');
    expect(toggleBtn).toBeInTheDocument();
    fireEvent.click(toggleBtn);
    expect(changeLanguageMock).toHaveBeenCalledWith('am');
  });
});
