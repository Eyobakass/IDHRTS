import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  it('matches snapshot for known status', () => {
    const { asFragment } = render(<StatusBadge status="ACTIVE" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot for unknown status', () => {
    const { asFragment } = render(<StatusBadge status="UNKNOWN_STATE" />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('validates props by rendering the correct mapped label and classes for ACTIVE', () => {
    render(<StatusBadge status="ACTIVE" className="custom-class" />);
    const badge = screen.getByText('ACTIVE');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'custom-class');
  });

  it('validates props by rendering the correct mapped label and classes for PENDING_REVIEW', () => {
    render(<StatusBadge status="PENDING_REVIEW" />);
    const badge = screen.getByText('Pending Review');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-amber-100', 'text-amber-800');
  });

  it('validates props by falling back to the raw status if not found in map', () => {
    render(<StatusBadge status="NEW_STATUS" />);
    const badge = screen.getByText('NEW_STATUS');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-600');
  });
});
