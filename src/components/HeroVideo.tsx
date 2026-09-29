import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const VIDEO_SRC = '/video/landing_page.mp4';

/** The clip's real pixel dimensions -- narrower than 9:16, so it must be stated. */
const VIDEO_WIDTH = 492;
const VIDEO_HEIGHT = 1080;

/**
 * The hero's proof: a loop of an actual run turning into a fight.
 *
 * Two things drive the implementation.
 *
 * Sizing is driven by HEIGHT, not width. At 492x1080 the clip is roughly 1:2.2,
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

        // React sets the `muted` PROPERTY but never renders the attribute, and
        // WebKit (Safari, and every iOS browser, Chrome included) judges
        // autoplay by the attribute: without it play() is refused with
        // NotAllowedError, as if the clip had sound. Set all three before the
        // source is attached so the element is muted from its first load.
        video.defaultMuted = true;
        video.muted = true;
        video.setAttribute('muted', '');

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
        Staging: a gold-and-violet halo behind the device, the page's accent
        light, so the phone reads as lit by the painting rather than pasted on.

        Static. A halo that pulses next to a playing video is two things
        competing for the same attention -- and the hero section's
        overflow-x-clip is what lets it spill wider than the frame without
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
        className="pointer-events-none absolute -inset-x-20 -inset-y-10
                   bg-[radial-gradient(50%_36%_at_50%_52%,rgba(251,191,36,0.26),transparent_70%),radial-gradient(46%_40%_at_50%_58%,rgba(124,58,237,0.16),transparent_72%)]"
      />

      {/*
        The device: a thin gold-rimmed bezel, so the clip reads as the app in
        hand rather than a video dropped onto the painting.
      */}
      <div
        className="relative rounded-[40px] border border-brand-accent/40 bg-[#04061a] p-1.5
                   shadow-[0_40px_100px_rgba(0,0,0,0.6)] md:rounded-[52px] md:p-2"
      >
        <div
          className="relative overflow-hidden rounded-[34px] bg-brand-surface md:rounded-[44px]
                     h-[min(62vh,498px)] md:h-[min(74vh,668px)]"
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

          {/* Suppresses the poster-to-first-frame flash on slower connections. */}
          <div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 bg-brand-bg/25 transition-opacity
                        duration-500 ${playing ? 'opacity-0' : 'opacity-100'}`}
          />
        </div>
      </div>
    </div>
  );
}
