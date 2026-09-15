import React from 'react';
import { render } from '@testing-library/react';
import SkeletonCard from '../SkeletonCard';

describe('SkeletonCard Component', () => {
  it('renders skeleton successfully', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });
});
