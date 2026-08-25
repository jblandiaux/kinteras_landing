/**
 * Isolated so LazyMotion can pull the animation feature set as its own chunk.
 *
 * With a static `features={domAnimation}` import, LazyMotion still ships every
 * byte in the main bundle -- it only defers *initialisation*. Handing it a
 * loader function is what actually moves the feature set off the critical path,
 * which matters on a page whose first paint is a headline and an email field.
 */
export { domAnimation as default } from 'framer-motion';
