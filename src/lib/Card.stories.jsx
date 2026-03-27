import React from 'react';

import Card, { CardHeader, CardTitle, CardContent, CardFooter } from './Card';
import Button from './Button';

export default {
  title: 'Shared/Card',
  component: Card,
  argTypes: {
    hover: { control: 'boolean' },
    glass: { control: 'boolean' },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
};

const Template = (args) => <Card {...args} />;

export const Default = Template.bind({});
Default.args = {
  children: (
    <div>
      <h3 className="text-lg font-bold mb-2">Default Card</h3>
      <p className="text-gray-600">This is a default card with medium padding and shadow.</p>
    </div>
  ),
};

export const GlassCard = Template.bind({});
GlassCard.args = {
  glass: true,
  children: (
    <div>
      <h3 className="text-lg font-bold mb-2">Glass Card</h3>
      <p className="text-gray-600">Glassmorphism effect with backdrop blur.</p>
    </div>
  ),
};

export const NoHover = Template.bind({});
NoHover.args = {
  hover: false,
  children: (
    <div>
      <h3 className="text-lg font-bold mb-2">Static Card</h3>
      <p className="text-gray-600">This card has no hover effect.</p>
    </div>
  ),
};

export const WithSubComponents = () => (
  <Card hover={false} className="max-w-md">
    <CardHeader>
      <CardTitle>Artwork #42</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-48 bg-gradient-to-br from-purple-400 to-blue-400 rounded-lg mb-4" />
      <p className="text-gray-600 text-sm">
        A collaborative AI-generated artwork exploring the boundaries of digital creativity.
      </p>
    </CardContent>
    <CardFooter>
      <div className="flex items-center justify-between w-full">
        <span className="text-sm font-semibold text-gray-900">0.5 XLM</span>
        <Button size="sm">Place Bid</Button>
      </div>
    </CardFooter>
  </Card>
);

export const CardGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {['Small Shadow', 'Medium Shadow', 'Large Shadow'].map((label, i) => (
      <Card key={label} shadow={['sm', 'md', 'lg'][i]} padding="md">
        <h3 className="font-bold mb-2">{label}</h3>
        <p className="text-gray-600 text-sm">Shadow variant: {['sm', 'md', 'lg'][i]}</p>
      </Card>
    ))}
  </div>
);
