import { existsSync, lstatSync, mkdirSync, readdirSync, readlinkSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Builds `.claude/skills/` (git-ignored) from `.agents/skills/`, the one committed home of the project's skills.
 *
 * Other AI tools read `.agents/skills/` directly; Claude Code reads skills only from `.claude/skills/`, so each skill
 * gets a link there. The link is a directory junction, which Windows creates without Developer Mode or admin rights;
 * on macOS and Linux Node makes it a plain directory symlink. `npm install` runs this through `postinstall`.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..');

const SOURCE_DIR = join(root, '.agents/skills');
const TARGET_DIR = join(root, '.claude/skills');

type LinkState = 'missing' | 'linked' | 'stale-link' | 'not-a-link';

function main(): void {
  if (!existsSync(SOURCE_DIR)) throw new Error(`No skills folder at ${SOURCE_DIR}`);
  mkdirSync(TARGET_DIR, { recursive: true });

  const skills = listSkills();
  for (const skill of skills) linkSkill(skill);
  removeOrphanLinks(new Set(skills));
}

/** Every folder in `.agents/skills/` that holds a `SKILL.md`. */
function listSkills(): string[] {
  return readdirSync(SOURCE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(SOURCE_DIR, entry.name, 'SKILL.md')))
    .map((entry) => entry.name);
}

function linkSkill(skill: string): void {
  const source = join(SOURCE_DIR, skill);
  const link = join(TARGET_DIR, skill);
  const state = linkState(link, source);

  if (state === 'linked') return;
  if (state === 'not-a-link') {
    // A real folder may hold someone's own edits, so it is never deleted here.
    console.warn(`skills:link - ${link} is a real folder, not a link; remove it and run npm run skills:link again`);
    return;
  }
  if (state === 'stale-link') rmSync(link, { recursive: true, force: true });
  symlinkSync(source, link, 'junction');
  console.log(`skills:link - .claude/skills/${skill} -> .agents/skills/${skill}`);
}

/** Removes links to skills that left `.agents/skills/`; real folders stay. */
function removeOrphanLinks(skills: ReadonlySet<string>): void {
  for (const entry of readdirSync(TARGET_DIR)) {
    const link = join(TARGET_DIR, entry);
    if (skills.has(entry) || !lstatSync(link).isSymbolicLink()) continue;
    rmSync(link, { recursive: true, force: true });
    console.log(`skills:link - removed .claude/skills/${entry}`);
  }
}

function linkState(link: string, source: string): LinkState {
  let stats;
  try {
    stats = lstatSync(link);
  } catch {
    return 'missing';
  }
  if (!stats.isSymbolicLink()) return 'not-a-link';
  const pointsToSource = resolve(TARGET_DIR, readlinkSync(link)) === resolve(source);
  return pointsToSource ? 'linked' : 'stale-link';
}

main();
