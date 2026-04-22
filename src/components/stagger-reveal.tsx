"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type StaggerRevealProps = {
  children: ReactNode;
  className?: string;
  delayChildren?: number;
  staggerChildren?: number;
};

type StaggerRevealItemProps = {
  children: ReactNode;
  className?: string;
  offset?: number;
};

export function StaggerReveal({
  children,
  className,
  delayChildren = 0,
  staggerChildren = 0.075,
}: StaggerRevealProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = prefersReducedMotion
    ? {
        hidden: {},
        visible: {},
      }
    : {
        hidden: {},
        visible: {
          transition: {
            delayChildren,
            staggerChildren,
          },
        },
      };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerRevealItem({
  children,
  className,
  offset = 18,
}: StaggerRevealItemProps) {
  const prefersReducedMotion = useReducedMotion();

  const variants: Variants = prefersReducedMotion
    ? {
        hidden: {
          opacity: 1,
        },
        visible: {
          opacity: 1,
        },
      }
    : {
        hidden: {
          opacity: 0,
          y: offset,
          filter: "blur(10px)",
        },
        visible: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            duration: 0.48,
            ease: [0.22, 1, 0.36, 1],
          },
        },
      };

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
