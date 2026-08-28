import { describe, expect, test } from 'bun:test';
import { chmod, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { poll } from './watcher.ts';

async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'hunk-reviewer-'));
  const hunk = join(dir, 'hunk');
  await writeFile(hunk, '#!/bin/sh\nprintf \'%s\\n\' \'{"result":{"comments":[{"id":"c1","filePath":"src/App.tsx","newLine":42,"summary":"Handle error"}]}}\'\n');
  await chmod(hunk, 0o755);
  return { dir, hunk, stateFile: join(dir, 'state.json'), output: join(dir, 'comments.jsonl') };
}

const options = (f: Awaited<ReturnType<typeof fixture>>, command: string) => ({
  hunk: f.hunk,
  repo: f.dir,
  stateFile: f.stateFile,
  command,
  logger: { info() {}, error() {} }
});

describe('poll', () => {
  test('baselines existing comments and dispatches only later comments', async () => {
    const f = await fixture();
    const command = `cat >> ${f.output}`;
    await poll({ ...options(f, command), baseline: true });
    expect(await readFile(f.stateFile, 'utf8')).toContain('c1');
    await expect(readFile(f.output, 'utf8')).rejects.toThrow();
  });

  test('dispatches new comments and persists their IDs', async () => {
    const f = await fixture();
    await poll({ ...options(f, `cat >> ${f.output}`), baseline: false });
    expect(await readFile(f.output, 'utf8')).toContain('"id":"c1"');

    await poll({ ...options(f, `cat >> ${f.output}`), baseline: false });
    expect((await readFile(f.output, 'utf8')).match(/"id":"c1"/g)).toHaveLength(1);
  });

  test('retries a comment when the receiver fails', async () => {
    const f = await fixture();
    await expect(poll({ ...options(f, 'exit 1'), baseline: false })).rejects.toThrow('dispatch exited 1');
    await poll({ ...options(f, `cat >> ${f.output}`), baseline: false });
    expect(await readFile(f.output, 'utf8')).toContain('"id":"c1"');
  });
});
