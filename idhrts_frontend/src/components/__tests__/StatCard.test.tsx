import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';

describe('StatCard Component', () => {
  it('renders inline variant by default', () => {
    render(<StatCard label="Total" value={10} />);
    expect(screen.getByText('Total:')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders metric variant correctly', () => {
    render(<StatCard label="Metric Total" value={100} variant="metric" />);
    expect(screen.getByText('Metric Total')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders metric variant with document icon', () => {
    const { container } = render(<StatCard label="Users" value={50} variant="metric" icon="document" />);
    const iconContainer = container.querySelector('.bg-gray-100.text-gray-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders metric variant with clock icon', () => {
    const { container } = render(<StatCard label="Users" value={50} variant="metric" icon="clock" />);
    const iconContainer = container.querySelector('.bg-amber-50.text-amber-500');
    expect(iconContainer).toBeInTheDocument();
  });

  it('renders metric variant with check icon', () => {
    const { container } = render(<StatCard label="Users" value={50} variant="metric" icon="check" />);
    const iconContainer = container.querySelector('.bg-green-50.text-green-600');
    expect(iconContainer).toBeInTheDocument();
  });
  
  it('renders metric variant with valueColor amber', () => {
    render(<StatCard label="Users" value={50} variant="metric" valueColor="amber" />);
    expect(screen.getByText('50')).toHaveClass('text-[#D97706]');
  });

  it('renders metric variant with valueColor green', () => {
    render(<StatCard label="Users" value={50} variant="metric" valueColor="green" />);
    expect(screen.getByText('50')).toHaveClass('text-[#16A34A]');
  });
});
