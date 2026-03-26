import React from 'react';
import { render, screen } from '@testing-library/react';

import Spinner from '../Spinner';

describe('Spinner Component', () => {
  test('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByTestId('spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8');
  });

  test('renders with small size', () => {
    render(<Spinner size="sm" />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-5', 'h-5');
  });

  test('renders with large size', () => {
    render(<Spinner size="lg" />);
    expect(screen.getByTestId('spinner')).toHaveClass('w-12', 'h-12');
  });

  test('renders with different colors', () => {
    const { rerender } = render(<Spinner color="blue" />);
    expect(screen.getByTestId('spinner')).toHaveClass('border-blue-600');

    rerender(<Spinner color="green" />);
    expect(screen.getByTestId('spinner')).toHaveClass('border-green-600');
  });

  test('has status role for accessibility', () => {
    render(<Spinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('has aria-label for accessibility', () => {
    render(<Spinner label="Loading data" />);
    expect(screen.getByRole('status')).toHaveAttribute(
      'aria-label',
      'Loading data',
    );
  });

  test('accepts custom className', () => {
    render(<Spinner className="custom-spinner" />);
    expect(screen.getByTestId('spinner')).toHaveClass('custom-spinner');
  });
});
