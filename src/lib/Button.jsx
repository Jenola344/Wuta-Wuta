import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon: Icon,
      iconPosition = 'left',
      className = '',
      onClick,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary:
        'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 focus:ring-purple-500 shadow-lg hover:shadow-xl',
      secondary:
        'bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 focus:ring-purple-500 shadow-md hover:shadow-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700',
      ghost:
        'text-gray-700 hover:bg-gray-100 focus:ring-purple-500 dark:text-gray-300 dark:hover:bg-gray-800',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={classes}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2
            data-testid="button-loading-spinner"
            className={`animate-spin ${iconSizes[size] || iconSizes.md} mr-2`}
          />
        )}

        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={`${iconSizes[size] || iconSizes.md} mr-2`} />
        )}

        {children}

        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={`${iconSizes[size] || iconSizes.md} ml-2`} />
        )}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
