import React from 'react';
import { motion } from 'framer-motion';

const GlassCard = ({ 
  children, 
  className = '', 
  intensity = 'medium',
  hover = true,
  ...props 
}) => {
  const intensityClasses = {
    light: 'bg-white/30 backdrop-blur-sm border-white/20',
    medium: 'bg-white/20 backdrop-blur-md border-white/30',
    heavy: 'bg-white/10 backdrop-blur-lg border-white/40'
  };

  const baseClasses = `
    rounded-2xl border transition-all duration-300
    ${intensityClasses[intensity] || intensityClasses.medium}
    ${hover ? 'hover:bg-white/30 hover:shadow-2xl hover:scale-[1.02]' : ''}
    ${className}
  `;

  return (
    <motion.div
      className={baseClasses}
      whileHover={hover ? { y: -4 } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default GlassCard;
