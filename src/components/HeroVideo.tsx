import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const VIDEO_SRC = '/video/landing_page.mp4';

/** The clip's real pixel dimensions -- narrower than 9:16, so it must be stated. */
const VIDEO_WIDTH = 496;
const VIDEO_HEIGHT = 1080;

/**
 * The hero's proof: a loop of an actual run turning into a fight.
 *
 * Two things drive the implementation.
 *
 * Sizing is driven by HEIGHT, not width. At 496x1080 the clip is roughly 1:2.18,
 * so a width-driven box explodes vertically -- full-bleed on a 375px phone would
 * be 712px tall and push the signup form off the screen entirely. Bounding the
 * height and letting width follow from the aspect ratio keeps the hero inside one
 * viewport at every breakpoint.
 *
 * The file is fetched only when the frame is about to be seen. `src` is assigned
 * from an IntersectionObserver rather than sitting in the markup, because both a
 * plain `src` and `preload="metadata"` already let the browser start pulling the
 * megabyte down.
 */
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Reduced motion: never fetch the clip at all. The poster carries the same
    // impression, and the megabyte is saved rather than merely paused.
    if (reducedMotion !== false) return;

    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        video.src = VIDEO_SRC;
        video.load();
        // Autoplay can still be refused (data saver, low power mode). The poster
        // stays up in that case, which is a fine outcome, so the rejection is
        // swallowed rather than surfaced.
        void video.play().then(
          () => setPlaying(true),
          () => setPlaying(false),
        );
      },
      { rootMargin: '300px 0px' },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div className="relative shrink-0">
      {/*
        Staging, in two layers, so the clip reads as "here is the product"
        rather than as a video dropped onto the background.

        A flat blurred rectangle was not enough: it fades uniformly and the
        frame still looked isolated on a dark page. A radial falls off from the
        centre of the device, and the ellipse underneath gives the frame
        something to stand on.

        Both are static. A halo that pulses next to a playing video is two
        things competing for the same attention -- and the hero section's
        overflow-x-clip is what lets them spill wider than the frame without
        widening the document.

        No blur filter on the ambient layer: a radial gradient is already a soft
        falloff, and blurring it on top only spread the same light thinner until
        it stopped registering against the dark page.

        Every centre is kept well inside its box. A radial centred near an edge
        is still at strength when the box ends, and the cut shows up as a hard
        straight line across the page -- which is exactly what a halo must not
        have.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-20 -inset-y-14
                   bg-[radial-gradient(56%_46%_at_50%_46%,rgba(59,130,246,0.5),transparent_70%),radial-gradient(42%_36%_at_28%_20%,rgba(139,92,246,0.42),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-7 left-1/2 h-14 w-[135%]
                   -translate-x-1/2 rounded-[50%] blur-xl
                   bg-[radial-gradient(50%_50%_at_50%_50%,rgba(59,130,246,0.5),transparent_70%)]"
      />

      <div
        className="relative overflow-hidden rounded-3xl border border-brand-border
                   bg-brand-surface shadow-[0_28px_70px_-20px_rgba(0,0,0,0.85)]
                   h-[min(58vh,540px)] md:h-[min(72vh,660px)]"
        style={{ aspectRatio: `${VIDEO_WIDTH} / ${VIDEO_HEIGHT}` }}
      >
        <video
          ref={videoRef}
          poster="/video/poster.webp"
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          muted
          loop
          playsInline
          // Decorative: everything it shows is stated in the headline and the
          // gameplay loop, so it carries no information of its own.
          aria-hidden="true"
          tabIndex={-1}
          preload="none"
          className="size-full object-cover"
        />

        {/* Vignette: softens the clip's own hard edges into the frame. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-3xl
                     shadow-[inset_0_0_60px_18px_rgba(7,11,31,0.55)]"
        />

        {/* Suppresses the poster-to-first-frame flash on slower connections. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-brand-bg/25 transition-opacity
                      duration-500 ${playing ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    </div>
  );
}
