import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const CopyButton = ({ text, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`relative inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors group ${className}`}
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      
      {/* Tooltip */}
      <span className={`absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-sm transition-opacity duration-200 pointer-events-none whitespace-nowrap ${copied ? 'opacity-100' : 'opacity-0'}`}>
        Copied!
        <span className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></span>
      </span>
    </button>
  );
};

export default CopyButton;
