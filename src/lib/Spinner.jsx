import React from 'react';
import { motion } from 'framer-motion';

const Spinner = React.forwardRef(
  ({ size = 'md', color = 'purple', className = '', label = 'Loading', ...props }, ref) => {
    const sizes = {
      sm: 'w-5 h-5 border-2',
      md: 'w-8 h-8 border-2',
      lg: 'w-12 h-12 border-3',
      xl: 'w-16 h-16 border-4',
    };

    const colors = {
      purple: 'border-purple-600 border-t-transparent',
      blue: 'border-blue-600 border-t-transparent',
      green: 'border-green-600 border-t-transparent',
      red: 'border-red-600 border-t-transparent',
      gray: 'border-gray-600 border-t-transparent',
      white: 'border-white border-t-transparent',
    };

    const classes = `${sizes[size] || sizes.md} ${colors[color] || colors.purple} rounded-full ${className}`;

    return (
      <motion.div
        ref={ref}
        className={classes}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        role="status"
        aria-label={label}
        data-testid="spinner"
        {...props}
      />
    );
  },
);

Spinner.displayName = 'Spinner';

export default Spinner;
