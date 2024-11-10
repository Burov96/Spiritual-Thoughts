"use client";

import { motion } from "framer-motion";

export function PageWrapper({ children, direction }) {
  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    animate: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0
    })
  };

  return (
    <motion.div
      custom={direction}
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
