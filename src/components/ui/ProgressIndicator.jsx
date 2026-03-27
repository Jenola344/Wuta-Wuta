import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

const ProgressIndicator = ({ 
  steps, 
  currentStep, 
  className = '',
  showLabels = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <motion.div
                className={`
                  ${sizeClasses[size]} 
                  rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : isCurrent 
                      ? 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }
                `}
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  rotate: isCurrent ? 360 : 0
                }}
                transition={{
                  scale: { duration: 0.3 },
                  rotate: { duration: 1, repeat: isCurrent ? Infinity : 0, ease: "linear" }
                }}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </motion.div>
              
              {showLabels && (
                <motion.span
                  className={`
                    mt-2 font-medium text-center
                    ${isCompleted 
                      ? 'text-purple-600 dark:text-purple-400' 
                      : isCurrent 
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-400'
                    }
                    ${textSizes[size]}
                  `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {step.label}
                </motion.span>
              )}
            </div>

            {index < steps.length - 1 && (
              <motion.div
                className={`
                  flex-1 h-0.5 mx-4
                  ${isCompleted 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600' 
                    : 'bg-gray-200 dark:bg-gray-700'
                  }
                `}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ProgressIndicator;
