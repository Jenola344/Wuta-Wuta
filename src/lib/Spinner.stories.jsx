import React from 'react';

import Spinner from './Spinner';

export default {
  title: 'Shared/Spinner',
  component: Spinner,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    color: {
      control: 'select',
      options: ['purple', 'blue', 'green', 'red', 'gray', 'white'],
    },
  },
};

const Template = (args) => <Spinner {...args} />;

export const Default = Template.bind({});
Default.args = {};

export const Small = Template.bind({});
Small.args = {
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  size: 'lg',
};

export const ExtraLarge = Template.bind({});
ExtraLarge.args = {
  size: 'xl',
};

export const AllSizes = () => (
  <div className="flex items-center gap-6">
    <div className="text-center">
      <Spinner size="sm" />
      <p className="text-xs text-gray-500 mt-2">Small</p>
    </div>
    <div className="text-center">
      <Spinner size="md" />
      <p className="text-xs text-gray-500 mt-2">Medium</p>
    </div>
    <div className="text-center">
      <Spinner size="lg" />
      <p className="text-xs text-gray-500 mt-2">Large</p>
    </div>
    <div className="text-center">
      <Spinner size="xl" />
      <p className="text-xs text-gray-500 mt-2">Extra Large</p>
    </div>
  </div>
);

export const AllColors = () => (
  <div className="flex items-center gap-6">
    {['purple', 'blue', 'green', 'red', 'gray'].map((color) => (
      <div key={color} className="text-center">
        <Spinner color={color} />
        <p className="text-xs text-gray-500 mt-2 capitalize">{color}</p>
      </div>
    ))}
  </div>
);

export const OnDarkBackground = () => (
  <div className="bg-gray-900 p-8 rounded-xl flex items-center gap-6">
    <Spinner color="white" size="sm" />
    <Spinner color="white" size="md" />
    <Spinner color="white" size="lg" />
  </div>
);

export const InlineWithText = () => (
  <div className="flex items-center gap-3">
    <Spinner size="sm" />
    <span className="text-gray-600">Loading artworks...</span>
  </div>
);
