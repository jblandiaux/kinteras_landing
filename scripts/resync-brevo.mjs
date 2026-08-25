/**
 * Pushes signups that never reached Brevo.
 *
 * The endpoint answers a signup as soon as D1 has the row, so a Brevo outage
 * leaves addresses on our list and not on theirs. This is the catch-up: it is
 * what makes `brevo_synced` worth having rather than a column nobody acts on.
 *
 *   BREVO_API_KEY=xxx BREVO_LIST_ID=3 node scripts/resync-brevo.mjs [--local]
 *
 * Safe to re-run: Brevo's updateEnabled makes each push idempotent, and only
 * rows still marked unsynced are considered.
 */
import { execFileSync } from 'node:child_process';

const LOCAL = process.argv.includes('--local');
const API_KEY = process.env.BREVO_API_KEY;
const LIST_ID = Number(process.env.BREVO_LIST_ID);
// Same override the Worker honours, so this script can be exercised against a
// stub instead of being the one piece of the flow nobody ever tests.
const API_BASE = process.env.BREVO_API_BASE || 'https://api.brevo.com';

if (!API_KEY || !Number.isFinite(LIST_ID) || LIST_ID <= 0) {
  console.error('Set BREVO_API_KEY and BREVO_LIST_ID before running this.');
  process.exit(1);
}

/**
 * Mirrors MARKETING_CONSENT_VERSIONS in shared/consent.ts.
 *
 * Hardcoded rather than imported because this script runs under plain Node
 * against a TypeScript module. Kept as a SQL filter so the guarantee holds at
 * the query level: an address consented under a launch-notification-only
 * wording is never selected here, no matter what its sync flag says.
 */
const MARKETING_VERSIONS = ['early-access-v2'];

function d1(sql) {
  const args = [
    'wrangler',
    'd1',
    'execute',
    'kinteras-landing',
    LOCAL ? '--local' : '--remote',
    '--json',
    '--command',
    sql,
  ];
  const out = execFileSync('npx', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  return JSON.parse(out)[0].results;
}

const versionList = MARKETING_VERSIONS.map((v) => `'${v}'`).join(', ');
const pending = d1(
  `SELECT email FROM early_access_signup
    WHERE brevo_synced = 0 AND consent_version IN (${versionList})
    ORDER BY id`,
);

if (pending.length === 0) {
  console.log('Nothing to resync.');
  process.exit(0);
}

console.log(`${pending.length} address(es) to push.`);

let synced = 0;
const failed = [];

for (const { email } of pending) {
  const response = await fetch(`${API_BASE}/v3/contacts`, {
    method: 'POST',
    headers: {
      'api-key': API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ email, listIds: [LIST_ID], updateEnabled: true }),
  });

  if (response.ok) {
    // Escaping: addresses come from our own validated column, but building SQL
    // by concatenation still deserves the doubled quote.
    d1(
      `UPDATE early_access_signup SET brevo_synced = 1 WHERE email = '${email.replace(/'/g, "''")}'`,
    );
    synced += 1;
  } else {
    failed.push(`${email}: ${response.status} ${await response.text().catch(() => '')}`);
  }

  // Brevo's contact endpoint is rate limited; this keeps a large catch-up well
  // under it without needing backoff logic.
  await new Promise((resolve) => setTimeout(resolve, 120));
}

console.log(`Synced ${synced}/${pending.length}.`);
if (failed.length > 0) {
  console.error('Failed:');
  for (const line of failed) console.error(`  ${line}`);
  process.exit(1);
}
