import React from 'react';
import { render, screen } from '@testing-library/react';

import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../Card';

describe('Card Component', () => {
  test('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  test('applies glass variant classes', () => {
    const { container } = render(<Card glass>Glass card</Card>);
    expect(container.firstChild).toHaveClass('backdrop-blur-xl');
  });

  test('applies padding sizes', () => {
    const { container } = render(<Card padding="lg">Padded</Card>);
    expect(container.firstChild).toHaveClass('p-8');
  });

  test('applies shadow sizes', () => {
    const { container } = render(<Card shadow="lg">Shadow</Card>);
    expect(container.firstChild).toHaveClass('shadow-xl');
  });

  test('disables hover when hover=false', () => {
    const { container } = render(<Card hover={false}>No hover</Card>);
    expect(container.firstChild).not.toHaveClass('hover:shadow-xl');
  });

  test('accepts custom className', () => {
    const { container } = render(<Card className="custom-class">Custom</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Card Sub-Components', () => {
  test('CardHeader renders children', () => {
    render(<CardHeader>Header</CardHeader>);
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  test('CardTitle renders as h3', () => {
    render(<CardTitle>Title</CardTitle>);
    const title = screen.getByText('Title');
    expect(title.tagName).toBe('H3');
    expect(title).toHaveClass('font-bold');
  });

  test('CardContent renders children', () => {
    render(<CardContent>Content</CardContent>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  test('CardFooter renders with border', () => {
    render(<CardFooter>Footer</CardFooter>);
    const footer = screen.getByText('Footer');
    expect(footer).toHaveClass('border-t');
  });
});
