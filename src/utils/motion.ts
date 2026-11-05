/**
 * Proxy-free `motion` for old browsers.
 *
 * `motion.div` from 'motion/react' is created through an ES `Proxy`. Safari 9 (iOS 9.3.5)
 * has no Proxy, so `motion.div` is `undefined` there and React throws error #130.
 * The explicit components from 'motion/react-client' don't need Proxy.
 * Import `motion` from here, never from 'motion/react'.
 */
import { div, circle, g } from 'motion/react-client';

export const motion = { div, circle, g };

export { AnimatePresence } from 'motion/react';
export type { Transition } from 'motion/react';
