import { CONSENT_HISTORY } from '../../shared/consent';

/**
 * BEFORE THE DOMAIN GOES LIVE, fill these in. They are the three facts a privacy
 * notice cannot be written without, and none of them can be guessed from the
 * codebase.
 *
 * - CONTROLLER: who is legally answerable for the data. A natural person's full
 *   name, or the company name plus its registration number.
 * - CONTACT: a mailbox that is actually monitored, on a domain you control.
 * - RETENTION: how long an address is kept if Early Access never opens.
 *
 * They are gathered here rather than scattered through the prose so that filling
 * them in is one edit, not a hunt.
 */
const CONTROLLER = 'Jonathan Blandiaux';
const CONTACT = 'privacy@kinteras.com';
const RETENTION =
  'until Kinteras Early Access opens and the launch announcement has been sent, ' +
  'and in any case no longer than 24 months after you signed up — or sooner, ' +
  'as soon as you ask us to delete it';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl tracking-[0.1em] text-brand-accent">{title}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-brand-ink-dim">{children}</div>
    </section>
  );
}

export function Privacy() {
  return (
    <main className="px-5 py-14 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[720px]">
        <a
          href="/"
          className="text-sm text-brand-ink-dim underline decoration-brand-ink-dim/40
                     underline-offset-4 transition-colors hover:text-brand-ink"
        >
          &larr; Back to Kinteras
        </a>

        <h1 className="mt-8 text-4xl font-extrabold tracking-[-0.02em]">Privacy</h1>
        <p className="mt-4 leading-relaxed text-brand-ink-dim">
          This page covers one thing: the email address you give us to be told when Kinteras
          Early Access opens. There is no account, no tracking profile and no advertising
          identifier behind it.
        </p>

        <Section title="WHO COLLECTS IT">
          <p>
            The data controller is {CONTROLLER}. You can reach us at{' '}
            <a href={`mailto:${CONTACT}`} className="text-brand-ink underline underline-offset-4">
              {CONTACT}
            </a>
            .
          </p>
        </Section>

        <Section title="WHAT WE STORE">
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your email address.</li>
            <li>The date and time you signed up.</li>
            <li>
              Which page and, if you arrived from a campaign link, which campaign brought you
              here (the <code className="text-brand-ink">utm_source</code>,{' '}
              <code className="text-brand-ink">utm_medium</code> and{' '}
              <code className="text-brand-ink">utm_campaign</code> values in the URL).
            </li>
            <li>Which version of the notice below you agreed to.</li>
          </ul>
          <p>
            We do not store your IP address, and we do not use cookies to identify you. Nothing
            here is combined with data from anywhere else.
          </p>
        </Section>

        <Section title="WHY">
          <p>
            Solely to email you once, when Kinteras Early Access opens. That is the purpose you
            consented to and it is the only thing your address will be used for. It is not sold,
            rented or shared for anyone else&apos;s marketing.
          </p>
          <p>
            If we ever want to send you something else — development updates, news, offers — we
            will ask you again, separately. Widening the purpose without asking is exactly what
            the versioned consent below exists to prevent.
          </p>
        </Section>

        <Section title="HOW LONG">
          <p>We keep your address {RETENTION}.</p>
        </Section>

        <Section title="WHO ELSE TOUCHES IT">
          <p>
            <span className="text-brand-ink">Cloudflare, Inc.</span> — hosts this page, runs the
            signup endpoint and stores the list in its D1 database. It also provides the
            cookieless page-view counter we use to see how many people visit; that counter does
            not identify individual visitors.
          </p>
          <p>No other processor has access to the list.</p>
        </Section>

        <Section title="YOUR RIGHTS">
          <p>
            You can ask us at any time for a copy of what we hold about you, to correct it, or to
            delete it — and you can withdraw your consent, which has the same practical effect as
            deletion. Write to{' '}
            <a href={`mailto:${CONTACT}`} className="text-brand-ink underline underline-offset-4">
              {CONTACT}
            </a>{' '}
            and we will act on it. You also have the right to complain to your national data
            protection authority.
          </p>
        </Section>

        <Section title="WHAT YOU AGREED TO">
          <p>
            Each signup records which version of this wording was shown at the time. Older
            versions stay listed here so the record can always be resolved back to the exact text.
          </p>
          <dl className="mt-4 space-y-3">
            {CONSENT_HISTORY.map((entry) => (
              <div
                key={entry.version}
                className="rounded-xl border border-brand-border/70 bg-brand-surface/40 px-4 py-3"
              >
                <dt className="text-sm tracking-wide text-brand-accent">
                  {entry.version} &middot; in use since {entry.since}
                </dt>
                <dd className="mt-1.5 text-brand-ink">&ldquo;{entry.text}&rdquo;</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </main>
  );
}
