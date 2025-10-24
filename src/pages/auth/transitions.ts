// components/auth/transitions.ts
import { Variants } from "framer-motion";

export const slideLeftVariants: Variants = {
  initial: { x: 40, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { x: -40, opacity: 0, transition: { duration: 0.2 } },
};

export const slideRightVariants: Variants = {
  initial: { x: -40, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { x: 40, opacity: 0, transition: { duration: 0.2 } },
};
