import type { CSSProperties } from 'react';
import { m } from 'framer-motion';
import { REVEAL_VIEWPORT, useRevealVariants } from '../lib/reveal';
import { SectionHeading } from './SectionHeading';

type Element = 'fire' | 'water' | 'electric' | 'stone' | 'nature';

/**
 * One tint per element, as an "r, g, b" triplet so the card can use it at
 * several strengths (glow, border, chip). `ink` is the chip's text colour:
 * a light tint of the same hue, which clears AA on the dark card.
 */
const ELEMENT_TINT: Record<Element, { rgb: string; ink: string }> = {
  fire: { rgb: '249, 115, 22', ink: '#fdba74' },
  water: { rgb: '56, 189, 248', ink: '#7dd3fc' },
  electric: { rgb: '250, 204, 21', ink: '#fde68a' },
  stone: { rgb: '214, 211, 209', ink: '#e7e5e4' },
  nature: { rgb: '74, 222, 128', ink: '#86efac' },
};

/** One creature per element, all fully evolved forms from the game. */
const CREATURES: ReadonlyArray<{ slug: string; name: string; element: Element }> = [
  { slug: 'pyrodrake', name: 'Pyrodrake', element: 'fire' },
  { slug: 'tsunamion', name: 'Tsunamion', element: 'water' },
  { slug: 'voltguard', name: 'Voltguard', element: 'electric' },
  { slug: 'tectonarch', name: 'Tectonarch', element: 'stone' },
  { slug: 'verdant_oracle', name: 'Verdant Oracle', element: 'nature' },
];

function cardStyle(element: Element): CSSProperties {
  const { rgb } = ELEMENT_TINT[element];
  return {
    borderColor: `rgba(${rgb}, 0.28)`,
    backgroundImage: `radial-gradient(90% 60% at 50% 32%, rgba(${rgb}, 0.28), rgba(${rgb}, 0) 70%)`,
  };
}

function chipStyle(element: Element): CSSProperties {
  const { rgb, ink } = ELEMENT_TINT[element];
  return { backgroundColor: `rgba(${rgb}, 0.14)`, color: ink };
}

/**
 * The collection, one creature per element.
 *
 * Below lg the cards sit in a horizontally scrolling row with snap points --
 * five cards squeezed into a phone or tablet width would shrink the art to
 * stamps. From lg up they are a plain five-column grid.
 */
export function Creatures() {
  const item = useRevealVariants();

  return (
    <section
      id="creatures"
      aria-labelledby="creatures-title"
      className="bg-brand-bg-deep py-14 md:py-28"
    >
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={REVEAL_VIEWPORT}
        transition={{ staggerChildren: 0.08 }}
        className="mx-auto max-w-[1440px]"
      >
        <div
          className="flex flex-col gap-4 px-5 sm:px-6 md:flex-row md:items-end md:justify-between
                     md:gap-12 md:px-10 lg:px-24"
        >
          <SectionHeading id="creatures-title" eyebrow="CREATURES" variants={item}>
            Raise a team <br className="hidden md:block" />
            worth running for.
          </SectionHeading>
          <m.p
            variants={item}
            className="max-w-[420px] text-base leading-relaxed text-brand-ink-dim md:text-lg"
          >
            Five elements. Each has an edge, and a weakness. Build the team that wins your next
            fight.
          </m.p>
        </div>

        <ul
          className="mt-8 flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-px-5 px-5 pb-2
                     [scrollbar-width:none] sm:scroll-px-6 sm:px-6 md:mt-14 md:scroll-px-10 md:px-10
                     lg:grid lg:grid-cols-5 lg:gap-5 lg:overflow-visible lg:px-24"
        >
          {CREATURES.map((creature) => (
            <m.li
              key={creature.slug}
              variants={item}
              style={cardStyle(creature.element)}
              className="flex h-[340px] w-[230px] shrink-0 snap-start flex-col justify-between
                         rounded-[22px] border bg-[#0e1438] p-5 lg:h-[420px] lg:w-auto
                         lg:rounded-3xl lg:p-6"
            >
              <img
                src={`/assets/creatures/${creature.slug}.webp`}
                alt={creature.name}
                width={384}
                height={384}
                loading="lazy"
                decoding="async"
                className="h-[200px] w-full object-contain lg:h-[250px]"
              />
              <div className="flex flex-col items-start gap-2.5">
                <h3 className="font-display text-[1.3125rem] font-bold lg:text-2xl">
                  {creature.name}
                </h3>
                <span
                  style={chipStyle(creature.element)}
                  className="inline-flex h-7 items-center gap-2 rounded-full pr-3 pl-1.5 text-xs
                             font-bold tracking-[0.08em] uppercase lg:h-[30px] lg:text-[0.8125rem]"
                >
                  <img
                    src={`/assets/elements/${creature.element}.png`}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    className="size-[18px] lg:size-5"
                  />
                  {creature.element}
                </span>
              </div>
            </m.li>
          ))}
        </ul>
      </m.div>
    </section>
  );
}
