import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

jest.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'font-inter' }),
}));

describe('RootLayout', () => {
  it('renders root layout with children and metadata', () => {
    expect(metadata.title).toContain('IDHRTS');
    render(
      <RootLayout>
        <div data-testid="child">Hello Root</div>
      </RootLayout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
