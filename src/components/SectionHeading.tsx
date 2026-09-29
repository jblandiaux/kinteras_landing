import type { ReactNode } from 'react';
import { m, type Variants } from 'framer-motion';

type SectionHeadingProps = {
  eyebrow: string;
  children: ReactNode;
  variants: Variants;
  align?: 'center' | 'start';
  /** id for the section's aria-labelledby. */
  id: string;
};

/**
 * The gold eyebrow over a Cinzel title that opens every content section, so the
 * four sections below the hero read as one family.
 */
export function SectionHeading({
  eyebrow,
  children,
  variants,
  align = 'start',
  id,
}: SectionHeadingProps) {
  // Phones always read left-aligned; `center` only takes effect from md up.
  const alignment =
    align === 'center' ? 'items-start text-left md:items-center md:text-center' : 'items-start text-left';

  return (
    <m.div variants={variants} className={`flex flex-col gap-3 md:gap-4 ${alignment}`}>
      <span className="font-display text-xs font-semibold tracking-[0.24em] text-brand-accent md:text-sm">
        {eyebrow}
      </span>
      <h2
        id={id}
        className="font-display text-[2rem] leading-[1.1] font-bold text-balance text-brand-ink-warm
                   md:text-[3.25rem] md:leading-[1.08]"
      >
        {children}
      </h2>
    </m.div>
  );
}
