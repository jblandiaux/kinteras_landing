import { LazyMotion } from 'framer-motion';
import { Hero } from './components/Hero';
import { GameplayLoop } from './components/GameplayLoop';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { Privacy } from './pages/Privacy';

/** Loaded as its own chunk, after the page has painted. */
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

/**
 * Two views, so two branches on the path. No router library: react-router would
 * add a dependency and a bundle for something this file already does, and the
 * landing has no nested routes, no params and no client-side navigation beyond
 * plain links.
 *
 * Motion is mounted through LazyMotion with the `domAnimation` feature set and
 * the lightweight `m` components, which is what keeps Framer Motion from
 * dominating the bundle of a page whose animations are fades and 2% scales.
 * `strict` makes the saving enforceable: importing a full `motion.*` component
 * anywhere would throw instead of silently pulling the whole library back in.
 */
export function App() {
  if (window.location.pathname.replace(/\/+$/, '') === '/privacy') {
    return <Privacy />;
  }

  return (
    <LazyMotion features={loadMotionFeatures} strict>
      <main>
        <Hero />
        <GameplayLoop />
        <FinalCta />
      </main>
      <Footer />
    </LazyMotion>
  );
}
