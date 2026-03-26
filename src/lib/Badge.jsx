import React from 'react';
import { motion } from 'framer-motion';

const Badge = React.forwardRef(
  (
    { children, variant = 'primary', size = 'md', className = '', icon: Icon, ...props },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center font-medium rounded-full transition-all duration-200';

    const variants = {
      primary: 'bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
      secondary: 'bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
      success: 'bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      danger: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
      info: 'bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
      outline: 'border border-gray-300 text-gray-700 bg-transparent dark:border-gray-600 dark:text-gray-300',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    const iconSizes = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
    };

    const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

    return (
      <motion.span
        ref={ref}
        className={classes}
        whileHover={{ scale: 1.05 }}
        {...props}
      >
        {Icon && <Icon className={`${iconSizes[size] || iconSizes.md} mr-1`} />}
        {children}
      </motion.span>
    );
  },
);

Badge.displayName = 'Badge';

export default Badge;
