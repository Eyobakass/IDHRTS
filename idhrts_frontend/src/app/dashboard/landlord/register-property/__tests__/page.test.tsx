import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterProperty from '../page';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock components
jest.mock('@/components/NavBar', () => () => <div data-testid="navbar" />);

jest.mock('@/lib/api', () => ({
  api: {
    post: jest.fn(),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('RegisterProperty Page', () => {
  let mockPush: jest.Mock;
  let getItemSpy: jest.SpyInstance;
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders register property form correctly', () => {
    render(<RegisterProperty />);
    expect(screen.getByText('Register New Property')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. A-205')).toBeInTheDocument();
  });

  it('submits form successfully with valid token payload and redirects', async () => {
    const payload = { sub_city_id: 'sub-1', woreda_id: 'wor-2' };
    const fakeJwt = `header.${btoa(JSON.stringify(payload))}.signature`;
    getItemSpy.mockReturnValue(fakeJwt);

    (api.post as jest.Mock).mockImplementation((url: string) => {
      if (url === '/properties/') {
        return Promise.resolve({ data: { id: 'prop-123' } });
      }
      if (url === '/properties/prop-123/submit/') {
        return Promise.resolve({ data: { status: 'PENDING_REVIEW' } });
      }
      return Promise.reject(new Error('not found'));
    });

    render(<RegisterProperty />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('e.g. A-205'), { target: { value: 'B-101' } });
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'APARTMENT' } });
    fireEvent.change(screen.getByPlaceholderText('Enter kebele name or number'), { target: { value: '04' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '12000' } });

    fireEvent.click(screen.getByRole('button', { name: /register & submit for review/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/properties/', {
        house_number: 'B-101',
        building_type: 'APARTMENT',
        kebele: '04',
        monthly_rent_etb: '12000',
        sub_city: 'sub-1',
        woreda: 'wor-2',
      });
      expect(api.post).toHaveBeenCalledWith('/properties/prop-123/submit/');
      expect(mockPush).toHaveBeenCalledWith('/dashboard/landlord');
    });
  });

  it('handles token retrieval when no token is present and token payload parse fails', async () => {
    getItemSpy.mockReturnValue(null);
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 'prop-456' } });

    render(<RegisterProperty />);

    fireEvent.change(screen.getByPlaceholderText('e.g. A-205'), { target: { value: 'A-1' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5000' } });

    fireEvent.click(screen.getByRole('button', { name: /register & submit for review/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/properties/', {
        house_number: 'A-1',
        building_type: 'VILLA',
        kebele: '',
        monthly_rent_etb: '5000',
        sub_city: undefined,
        woreda: undefined,
      });
    });
  });

  it('handles malformed token in localStorage by catching error and continuing', async () => {
    getItemSpy.mockReturnValue('invalid_token_without_dot');
    (api.post as jest.Mock).mockResolvedValue({ data: { id: 'prop-789' } });

    render(<RegisterProperty />);

    fireEvent.change(screen.getByPlaceholderText('e.g. A-205'), { target: { value: 'C-3' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '4000' } });
    fireEvent.click(screen.getByRole('button', { name: /register & submit for review/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/properties/', expect.objectContaining({
        house_number: 'C-3',
        monthly_rent_etb: '4000',
        sub_city: undefined,
        woreda: undefined,
      }));
    });
  });

  it('shows alert when API submission fails', async () => {
    getItemSpy.mockReturnValue(null);
    (api.post as jest.Mock).mockRejectedValue(new Error('Server Error'));

    render(<RegisterProperty />);

    fireEvent.change(screen.getByPlaceholderText('e.g. A-205'), { target: { value: 'A-1' } });
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '5000' } });

    fireEvent.click(screen.getByRole('button', { name: /register & submit for review/i }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Error registering property.');
    });
  });
});
