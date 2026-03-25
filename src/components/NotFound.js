import React from 'react';
import { motion } from 'framer-motion';
import { Compass, Home, Sparkles } from 'lucide-react';

import { useWalletStore } from '../store/walletStore';

import { Button } from './ui';


const NotFound = ({ onReturn }) => {
  return (
    <div className="flex flex-col items-center overflow-hidden justify-center flex-1 w-full  text-center px-4 relative bg-gray-50/50">
      {/* Background AI-inspired floating elements */}
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-20 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-[500px] h-[500px] bg-purple-500/30 rounded-full blur-[120px] absolute -top-20 -right-20"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [-50, 50, -50],
            y: [50, -50, 50],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[100px] absolute -bottom-40 -left-40"
        />
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="z-10 flex flex-col items-center"
      >
        <div className="relative mb-8">
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="text-purple-600 drop-shadow-lg"
          >
            <Compass size={120} strokeWidth={1} />
          </motion.div>

          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-4 text-blue-500"
          >
            <Sparkles size={32} />
          </motion.div>
        </div>

        <h1 className="text-5xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 mb-4 tracking-tight">
          404
        </h1>

        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Lost in the Muse
        </h2>

        <p className="text-gray-600 max-w-md mb-8 text-lg">
          The artwork you're looking for seems to have drifted into the latent space. Let's guide you back to familiar canvases.
        </p>

        <button
          onClick={() => onReturn('gallery')}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg hover:shadow-purple-500/30 w-auto group"
        >
          <Home className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
          <span>Return to Gallery</span>
        </button>
      </motion.div>
    </div>
  );
};

export default NotFound;
