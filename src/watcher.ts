import { execFile, spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function readUserComments({ hunk = 'hunk', repo }) {
  const { stdout } = await execFileAsync(hunk, [
    'session', 'comment', 'list', '--repo', repo, '--type', 'user', '--json'
  ]);
  const payload = JSON.parse(stdout);
  return payload.result?.comments ?? payload.comments ?? [];
}

export async function loadState(path) {
  try { return new Set(JSON.parse(await fs.readFile(path, 'utf8'))); }
  catch (error) { if (error.code === 'ENOENT') return new Set(); throw error; }
}

export async function saveState(path, ids) {
  await fs.writeFile(path, `${JSON.stringify([...ids].sort(), null, 2)}\n`);
}

export function dispatch(command, comment) {
  return new Promise((resolve, reject) => {
    const child = spawn('/bin/sh', ['-c', command], { stdio: ['pipe', 'inherit', 'inherit'] });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0
      ? resolve()
      : reject(new Error(`dispatch exited ${code ?? `with ${signal}`}`)));
    child.stdin.end(`${JSON.stringify(comment)}\n`);
  });
}

export function dispatchToAgent(target, comment) {
  return new Promise((resolve, reject) => {
    const child = spawn('herdr', ['agent', 'prompt', target, JSON.stringify(comment)], { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => code === 0
      ? resolve()
      : reject(new Error(`agent dispatch exited ${code ?? `with ${signal}`}`)));
  });
}

export async function poll({ hunk, repo, command, agentTarget, stateFile, baseline, logger = console }) {
  const comments = await readUserComments({ hunk, repo });
  const seen = await loadState(stateFile);
  if (baseline && seen.size === 0) comments.forEach(comment => seen.add(comment.id));

  for (const comment of comments) {
    if (!comment.id || seen.has(comment.id)) continue;
    if (agentTarget) await dispatchToAgent(agentTarget, comment);
    else await dispatch(command, comment);
    seen.add(comment.id);
    logger.info(`Dispatched Hunk comment ${comment.id}`);
  }
  await saveState(stateFile, seen);
  return comments.length;
}

export function startWatching(options) {
  let stopped = false;
  const run = async () => {
    try { await poll(options); }
    catch (error) { options.logger?.error(error.message); if (options.failFast) throw error; }
  };
  const timer = setInterval(run, options.intervalMs);
  return { stop() { stopped = true; clearInterval(timer); }, get stopped() { return stopped; } };
}
