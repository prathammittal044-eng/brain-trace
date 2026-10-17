import React from 'react';
import { motion, useScroll, useSpring } from 'motion/react';

export const ScrollProgressBar: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-black via-neutral-800 to-amber-400 origin-left z-[9999] pointer-events-none shadow-sm"
      style={{ scaleX }}
    />
  );
};
