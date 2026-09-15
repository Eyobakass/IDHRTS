import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState Component', () => {
  it('renders with default title when no props are provided', () => {
    render(<EmptyState />);
    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(<EmptyState title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState description="Custom Description" />);
    expect(screen.getByText('Custom Description')).toBeInTheDocument();
  });

  it('does not render description if not provided', () => {
    const { container } = render(<EmptyState />);
    const descriptionElement = container.querySelector('p.max-w-xs');
    expect(descriptionElement).toBeNull();
  });
});
