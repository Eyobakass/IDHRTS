import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from '../Modal';

describe('Modal Component', () => {
  it('matches snapshot when open', () => {
    const { asFragment } = render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('matches snapshot when closed', () => {
    const { asFragment } = render(
      <Modal open={false} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('validates props correctly - renders title and children when open', () => {
    render(
      <Modal open={true} onClose={() => {}} title="Dynamic Title">
        <p>Dynamic Child</p>
      </Modal>
    );
    expect(screen.getByText('Dynamic Title')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Child')).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <Modal open={false} onClose={() => {}} title="Dynamic Title">
        <p>Dynamic Child</p>
      </Modal>
    );
    expect(screen.queryByText('Dynamic Title')).not.toBeInTheDocument();
    expect(screen.queryByText('Dynamic Child')).not.toBeInTheDocument();
  });

  it('calls onClose when background overlay is clicked', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    const overlay = container.querySelector('.bg-black\\/40');
    if (overlay) fireEvent.click(overlay);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    const { container } = render(
      <Modal open={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    const closeBtn = container.querySelector('button');
    if (closeBtn) fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
