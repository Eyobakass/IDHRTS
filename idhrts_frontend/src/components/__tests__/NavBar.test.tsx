import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NavBar from '../NavBar';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

describe('NavBar Component', () => {
  const mockPush = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useAuthStore as unknown as jest.Mock).mockImplementation((selector) => {
      return selector({ logout: mockLogout });
    });
  });

  it('renders default light variant when variant is not provided', () => {
    const { asFragment } = render(<NavBar portalName="Test Portal" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders default light variant when variant is undefined', () => {
    const { asFragment } = render(<NavBar portalName="Test Portal" variant={undefined} />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot for light variant', () => {
    const { asFragment } = render(<NavBar portalName="Test Portal" variant="light" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot for dark variant', () => {
    const { asFragment } = render(<NavBar portalName="Test Portal" variant="dark" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders portalName correctly in dark variant', () => {
    render(<NavBar portalName="Dark Portal" variant="dark" />);
    expect(screen.getByText('Dark Portal')).toBeInTheDocument();
  });

  it('renders links correctly when provided in light variant', () => {
    const links = [
      { label: 'Home', href: '/home' },
      { label: 'Dashboard', href: '/dashboard' },
    ];
    render(<NavBar portalName="Test Portal" variant="light" links={links} />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders Profile when showProfile is true in light variant', () => {
    render(<NavBar portalName="Test Portal" variant="light" showProfile={true} />);
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('calls logout and routes to /login on logout button click', () => {
    render(<NavBar portalName="Test Portal" variant="light" showProfile={false} />);
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('calls logout and routes to /login on logout button click for dark variant', () => {
    render(<NavBar portalName="Test Portal" variant="dark" />);
    const logoutBtn = screen.getByText('Logout');
    fireEvent.click(logoutBtn);
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
