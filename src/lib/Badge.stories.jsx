import React from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

import Badge from './Badge';

export default {
  title: 'Shared/Badge',
  component: Badge,
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'info', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

const Template = (args) => <Badge {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary',
  variant: 'primary',
};

export const Success = Template.bind({});
Success.args = {
  children: 'Active',
  variant: 'success',
};

export const Warning = Template.bind({});
Warning.args = {
  children: 'Pending',
  variant: 'warning',
};

export const Danger = Template.bind({});
Danger.args = {
  children: 'Error',
  variant: 'danger',
};

export const WithIcon = Template.bind({});
WithIcon.args = {
  children: 'Verified',
  variant: 'success',
  icon: CheckCircle,
};

export const AllVariants = () => (
  <div className="flex flex-wrap gap-3 items-center">
    <Badge variant="primary">Primary</Badge>
    <Badge variant="secondary">Secondary</Badge>
    <Badge variant="success">Success</Badge>
    <Badge variant="warning">Warning</Badge>
    <Badge variant="danger">Danger</Badge>
    <Badge variant="info">Info</Badge>
    <Badge variant="outline">Outline</Badge>
  </div>
);

export const AllSizes = () => (
  <div className="flex flex-wrap gap-3 items-center">
    <Badge size="sm">Small</Badge>
    <Badge size="md">Medium</Badge>
    <Badge size="lg">Large</Badge>
  </div>
);

export const WithIcons = () => (
  <div className="flex flex-wrap gap-3 items-center">
    <Badge variant="success" icon={CheckCircle}>
      Verified
    </Badge>
    <Badge variant="warning" icon={AlertTriangle}>
      Pending
    </Badge>
    <Badge variant="info" icon={Info}>
      Draft
    </Badge>
    <Badge variant="danger" icon={XCircle}>
      Rejected
    </Badge>
  </div>
);

export const StatusLabels = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20">Artwork:</span>
      <Badge variant="success" size="sm">
        Minted
      </Badge>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20">Auction:</span>
      <Badge variant="warning" size="sm">
        Live
      </Badge>
    </div>
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-20">Network:</span>
      <Badge variant="info" size="sm">
        Testnet
      </Badge>
    </div>
  </div>
);
