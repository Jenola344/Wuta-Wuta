import React from 'react';
import { Heart, ArrowRight, Download } from 'lucide-react';

import Button from './Button';

export default {
  title: 'Shared/Button',
  component: Button,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};

const Template = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Button',
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  children: 'Secondary Button',
  variant: 'secondary',
};

export const Ghost = Template.bind({});
Ghost.args = {
  children: 'Ghost Button',
  variant: 'ghost',
};

export const Small = Template.bind({});
Small.args = {
  children: 'Small',
  size: 'sm',
};

export const Large = Template.bind({});
Large.args = {
  children: 'Large Button',
  size: 'lg',
};

export const Loading = Template.bind({});
Loading.args = {
  children: 'Loading...',
  loading: true,
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Disabled',
  disabled: true,
};

export const WithIconLeft = Template.bind({});
WithIconLeft.args = {
  children: 'Like',
  icon: Heart,
  iconPosition: 'left',
};

export const WithIconRight = Template.bind({});
WithIconRight.args = {
  children: 'Next',
  icon: ArrowRight,
  iconPosition: 'right',
};

export const AllVariants = () => (
  <div className="flex flex-wrap gap-4 items-center">
    <Button variant="primary">Primary</Button>
    <Button variant="secondary">Secondary</Button>
    <Button variant="ghost">Ghost</Button>
    <Button loading>Loading</Button>
    <Button disabled>Disabled</Button>
    <Button icon={Download} size="sm">
      Download
    </Button>
  </div>
);
