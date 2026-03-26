import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import Modal from '../Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    title: 'Test Modal',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders when isOpen is true', () => {
    render(<Modal {...defaultProps}>Modal content</Modal>);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  test('does not render when isOpen is false', () => {
    render(
      <Modal {...defaultProps} isOpen={false}>
        Modal content
      </Modal>,
    );
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  test('renders close button by default', () => {
    render(<Modal {...defaultProps}>Content</Modal>);
    expect(screen.getByTestId('modal-close-button')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    render(<Modal {...defaultProps}>Content</Modal>);
    fireEvent.click(screen.getByTestId('modal-close-button'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose on Escape key', () => {
    render(<Modal {...defaultProps}>Content</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  test('hides close button when showCloseButton is false', () => {
    render(
      <Modal {...defaultProps} showCloseButton={false}>
        Content
      </Modal>,
    );
    expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument();
  });

  test('accepts custom className', () => {
    render(
      <Modal {...defaultProps} className="custom-modal">
        Content
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveClass('custom-modal');
  });

  test('renders without title', () => {
    render(
      <Modal isOpen={true} onClose={jest.fn()}>
        Content only
      </Modal>,
    );
    expect(screen.getByText('Content only')).toBeInTheDocument();
  });
});
