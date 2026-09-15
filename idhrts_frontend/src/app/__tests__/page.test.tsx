import React from 'react';
import Home from '../page';
import { redirect } from 'next/navigation';

jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

describe('Root Page', () => {
  it('redirects to /login', () => {
    Home();
    expect(redirect).toHaveBeenCalledWith('/login');
  });
});
