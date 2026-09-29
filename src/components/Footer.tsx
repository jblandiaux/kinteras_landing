/**
 * Deliberately small.
 *
 * No social icons yet: the accounts do not exist, and a row of links that go
 * nowhere costs more trust than an empty footer does.
 */
export function Footer() {
  return (
    <footer className="border-t border-brand-border/50 bg-brand-bg-deep px-5 py-10 sm:px-6">
      <div
        className="mx-auto flex max-w-[1100px] flex-col items-center gap-5 text-sm
                   text-brand-ink-dim sm:flex-row sm:justify-between"
      >
        <img
          src="/assets/logo/wordmark.png"
          alt="Kinteras"
          width={447}
          height={128}
          loading="lazy"
          decoding="async"
          className="h-auto w-[110px] opacity-70"
        />

        <div className="flex items-center gap-5">
          <span>&copy; {new Date().getFullYear()} Kinteras</span>
          <a
            href="/privacy"
            className="underline decoration-brand-ink-dim/40 underline-offset-4
                       transition-colors hover:text-brand-ink"
          >
            Privacy
          </a>
        </div>
      </div>
    </footer>
  );
}
