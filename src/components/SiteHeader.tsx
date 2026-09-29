const NAV_LINKS = [
  { href: '#loop', label: 'The game' },
  { href: '#creatures', label: 'Creatures' },
  { href: '#world', label: 'World' },
  { href: '#how', label: 'How it works' },
] as const;

/**
 * Wordmark and in-page navigation. Not sticky: the page is short enough that a
 * bar following the reader would cost more attention than it saves.
 *
 * Phones get the wordmark and the Early Access pill only -- four anchors do not
 * justify a menu button, and the sections are one thumb-scroll apart anyway.
 */
export function SiteHeader() {
  return (
    <header className="flex h-[72px] items-center justify-between md:h-[104px]">
      <a href="/" aria-label="Kinteras, home">
        <img
          src="/assets/logo/wordmark.png"
          alt=""
          width={447}
          height={128}
          /* Native width is 447px, so 118-168 CSS px is already a 2x+ asset. */
          className="h-auto w-[118px] md:w-[168px]"
          fetchPriority="high"
        />
      </a>

      <nav aria-label="Main" className="flex items-center gap-10">
        <ul className="hidden items-center gap-10 text-[0.9375rem] font-semibold tracking-[0.02em] lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="transition-colors hover:text-brand-accent">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <a
          href="#early-access"
          className="inline-flex h-11 items-center rounded-full border border-brand-accent/55 px-5
                     text-xs font-extrabold tracking-[0.08em] text-brand-accent transition-colors
                     hover:bg-brand-accent/10 md:px-[22px] md:text-[0.8125rem]"
        >
          EARLY ACCESS
        </a>
      </nav>
    </header>
  );
}
