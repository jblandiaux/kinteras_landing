const FACTS = [
  { title: 'Real kilometres', detail: 'become XP and loot' },
  { title: 'Five elements', detail: 'fire, water, electric, stone, nature' },
  { title: 'Five realms', detail: 'to unlock, one run at a time' },
] as const;

/**
 * Three facts between the hero and the loop, as a ruled band. Every number in
 * it is a count the game actually ships -- no invented player stats.
 */
export function FactBand() {
  return (
    <section
      aria-label="Kinteras at a glance"
      className="border-y border-brand-border/45 bg-brand-bg px-5 sm:px-6 md:px-10 lg:px-24"
    >
      <ul
        className="mx-auto grid max-w-[1248px] divide-y divide-brand-border/45
                   md:grid-cols-3 md:divide-x md:divide-y-0"
      >
        {FACTS.map((fact) => (
          <li
            key={fact.title}
            className="flex flex-col items-center gap-1.5 py-6 text-center md:py-10"
          >
            <span className="font-display text-xl font-bold text-brand-ink-warm md:text-[1.625rem]">
              {fact.title}
            </span>
            <span className="text-sm text-brand-ink-dim md:text-[0.9375rem]">{fact.detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
