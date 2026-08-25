/**
 * Applies every file in migrations/ in filename order.
 *
 *   node scripts/migrate.mjs [--local|--remote]
 *
 * Replaces the previous per-file npm scripts, which named `0001` in the command
 * itself — so adding `0002` left every environment silently one migration
 * behind until someone noticed the column was missing.
 *
 * Each file must be re-runnable: `ALTER TABLE ... ADD COLUMN` is not, so a
 * duplicate-column error is treated as "already applied" rather than a failure.
 * That keeps this safe to run against a database at any point in its history.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const target = process.argv.includes('--remote') ? '--remote' : '--local';
const dir = 'migrations';

const files = readdirSync(dir)
  .filter((name) => name.endsWith('.sql'))
  .sort();

if (files.length === 0) {
  console.log('No migrations found.');
  process.exit(0);
}

let applied = 0;
let skipped = 0;

for (const name of files) {
  process.stdout.write(`${name} ... `);
  try {
    execFileSync(
      'npx',
      ['wrangler', 'd1', 'execute', 'kinteras-landing', target, '--file', join(dir, name)],
      { encoding: 'utf8', stdio: 'pipe' },
    );
    console.log('applied');
    applied += 1;
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    if (/duplicate column name/i.test(output)) {
      console.log('already applied');
      skipped += 1;
      continue;
    }
    console.log('FAILED');
    console.error(output.trim());
    process.exit(1);
  }
}

console.log(`\n${applied} applied, ${skipped} already in place.`);
