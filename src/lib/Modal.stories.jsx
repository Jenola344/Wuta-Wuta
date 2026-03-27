import React, { useState } from 'react';

import Modal from './Modal';
import Button from './Button';

export default {
  title: 'Shared/Modal',
  component: Modal,
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
    },
    showCloseButton: { control: 'boolean' },
    closeOnBackdropClick: { control: 'boolean' },
  },
};

const ModalDemo = ({ size, title, showCloseButton, closeOnBackdropClick, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        size={size}
        showCloseButton={showCloseButton}
        closeOnBackdropClick={closeOnBackdropClick}
      >
        {children}
      </Modal>
    </div>
  );
};

export const Default = () => (
  <ModalDemo title="Default Modal" size="md">
    <p className="text-gray-600">This is a default modal with a title and close button.</p>
  </ModalDemo>
);

export const Small = () => (
  <ModalDemo title="Small Modal" size="sm">
    <p className="text-gray-600">A compact modal for simple confirmations.</p>
    <div className="mt-4 flex gap-3 justify-end">
      <Button variant="ghost" size="sm">
        Cancel
      </Button>
      <Button size="sm">Confirm</Button>
    </div>
  </ModalDemo>
);

export const Large = () => (
  <ModalDemo title="Large Modal" size="lg">
    <div className="space-y-4">
      <p className="text-gray-600">
        A larger modal suitable for forms and detailed content.
      </p>
      <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
        Content area
      </div>
    </div>
  </ModalDemo>
);

export const NoCloseButton = () => (
  <ModalDemo title="No Close Button" size="md" showCloseButton={false}>
    <p className="text-gray-600">
      This modal has no close button. Use Escape or the backdrop to close.
    </p>
  </ModalDemo>
);

export const WithForm = () => (
  <ModalDemo title="Create Artwork" size="md">
    <form className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter artwork title"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          rows={3}
          placeholder="Describe your artwork"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost">Cancel</Button>
        <Button>Create</Button>
      </div>
    </form>
  </ModalDemo>
);
