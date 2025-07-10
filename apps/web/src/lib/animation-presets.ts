// Animation Presets for Xplore Design System
// This file contains reusable animation configurations for Framer Motion

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const scaleInSpring = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { 
    duration: 0.5, 
    type: 'spring', 
    stiffness: 100, 
    damping: 15 
  },
}

export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  modal: {
    initial: { opacity: 0, scale: 0.9, y: 20 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.9, y: 20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export const drawerVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  drawer: {
    initial: { x: '100%' },
    animate: { x: 0 },
    exit: { x: '100%' },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
}

export const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 50, scale: 0.9 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const dropdownVariants = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: -10 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

export const tabContentVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const accordionVariants = {
  closed: { height: 0, opacity: 0 },
  open: { height: 'auto', opacity: 1 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const cardHoverVariants = {
  initial: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.02 },
  transition: { duration: 0.2, ease: 'easeOut' },
}

export const buttonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.95 },
  transition: { duration: 0.1, ease: 'easeOut' },
}

export const iconVariants = {
  initial: { rotate: 0 },
  hover: { rotate: 180 },
  transition: { duration: 0.3, ease: 'easeInOut' },
}

export const pulseVariants = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.05, 1] },
  transition: { 
    duration: 2, 
    repeat: Infinity, 
    ease: 'easeInOut' 
  },
}

export const slideUpVariants = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const slideDownVariants = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' },
}

export const pageTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.3, ease: 'easeOut' },
}

export const loadingSpinner = {
  animate: { rotate: 360 },
  transition: { duration: 1, repeat: Infinity, ease: 'linear' },
}

export const bounceIn = {
  initial: { opacity: 0, scale: 0.3 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 10,
    },
  },
  exit: { opacity: 0, scale: 0.3 },
}

// Utility functions for animations
export const createDelayedAnimation = (baseAnimation: any, delay: number) => ({
  ...baseAnimation,
  transition: {
    ...baseAnimation.transition,
    delay,
  },
})

export const createSpringAnimation = (baseAnimation: any, config = {}) => ({
  ...baseAnimation,
  transition: {
    type: 'spring',
    stiffness: 100,
    damping: 15,
    ...config,
  },
})

export const createEaseAnimation = (baseAnimation: any, ease = 'easeOut') => ({
  ...baseAnimation,
  transition: {
    ...baseAnimation.transition,
    ease,
  },
})

// Animation configuration presets
export const animationConfig = {
  fast: { duration: 0.2 },
  normal: { duration: 0.3 },
  slow: { duration: 0.5 },
  spring: { type: 'spring', stiffness: 100, damping: 15 },
  bounce: { type: 'spring', stiffness: 400, damping: 10 },
  easeIn: { ease: 'easeIn' },
  easeOut: { ease: 'easeOut' },
  easeInOut: { ease: 'easeInOut' },
}