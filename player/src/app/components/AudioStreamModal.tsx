import React, { useEffect } from 'react';
import useGlobalState from '../GlobalState';
import { motion, AnimatePresence } from 'framer-motion'; // If you use framer-motion

const AIVoiceModal: React.FC = () => {
  const { isAIVoicePlaying } = useGlobalState();
  
  // Optional: prevent background scrolling when modal is open
  useEffect(() => {
    if (isAIVoicePlaying) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isAIVoicePlaying]);

  return (
    <AnimatePresence>
      {isAIVoicePlaying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/40"
        >
          <div className="bg-gray-100 rounded-3xl p-8 shadow-lg w-160 h-160 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-48 h-48 rounded-full bg-blue-100 flex items-center justify-center mb-6">
                <div className="relative">
                  {/* Audio visualization or animation here */}
                  <div className="absolute inset-0 flex space-x-2 justify-center items-center">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-2 bg-blue-500 rounded-full"
                        animate={{
                          height: [10, 30, 10],
                          transition: {
                            repeat: Infinity,
                            duration: 1,
                            delay: i * 0.1,
                          },
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-3">Audio Message</h3>
              <p className="text-xl text-gray-600 text-center">
                AI is speaking...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIVoiceModal; 