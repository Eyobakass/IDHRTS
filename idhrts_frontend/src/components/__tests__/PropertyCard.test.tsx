import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyCard from '../PropertyCard';

jest.mock('../StatusBadge', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <div data-testid="status-badge">{status}</div>,
}));

describe('PropertyCard Component', () => {
  const defaultProperty = {
    id: '1',
    house_number: '123',
    building_type: 'VILLA',
    monthly_rent_etb: 5000,
    status: 'ACTIVE',
    kebele: '01',
  };

  it('renders property details correctly', () => {
    render(<PropertyCard property={defaultProperty} />);
    expect(screen.getByText('House #123')).toBeInTheDocument();
    expect(screen.getByText('VILLA')).toBeInTheDocument();
    expect(screen.getByText('ETB 5,000/mo')).toBeInTheDocument();
    expect(screen.getByText('Woreda · Kebele 01')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('ACTIVE');
  });

  it('renders without kebele if not provided', () => {
    const propWithoutKebele = { ...defaultProperty, kebele: undefined };
    render(<PropertyCard property={propWithoutKebele} />);
    expect(screen.getByText('Woreda')).toBeInTheDocument();
  });

  it('uses default fallback for unknown status strip', () => {
    const propUnknownStatus = { ...defaultProperty, status: 'UNKNOWN' };
    const { container } = render(<PropertyCard property={propUnknownStatus} />);
    const strip = container.querySelector('.h-2\\.5.w-full');
    expect(strip).toHaveClass('bg-[#6B7280]');
  });

  it('uses proper strip color for ACTIVE', () => {
    const { container } = render(<PropertyCard property={defaultProperty} />);
    const strip = container.querySelector('.h-2\\.5.w-full');
    expect(strip).toHaveClass('bg-[#16A34A]');
  });

  it('handles missing monthly_rent_etb fallback gracefully', () => {
    const propZeroRent = { ...defaultProperty, monthly_rent_etb: 0 };
    render(<PropertyCard property={propZeroRent} />);
    expect(screen.getByText('ETB 0/mo')).toBeInTheDocument();
  });
});
