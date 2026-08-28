#!/usr/bin/env bun
import process from 'node:process';
import { poll, startWatching } from './watcher.ts';

function usage() {
  console.log(`Usage: hunk-review watch --repo PATH (--agent-target NAME | --command COMMAND) [options]

Poll Hunk user comments and dispatch each new comment to a Herdr agent or command.

Options:
  --repo PATH          Hunk session repository path (required)
  --agent-target NAME  Herdr agent receiving comment JSON as a prompt
  --command CMD        command receiving one comment JSON object on stdin
  --interval MS        polling interval (default: 2000)
  --state-file PATH    deduplication state (default: REPO/.hunk-reviewer-state.json)
  --no-baseline        dispatch comments already present on first poll
  --once               poll once and exit
  -h, --help           show this help`);
}

function parseArgs(argv) {
  const args = { intervalMs: 2000, baseline: true, once: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') { usage(); process.exit(0); }
    if (arg === '--no-baseline') { args.baseline = false; continue; }
    const key = { '--repo': 'repo', '--command': 'command', '--agent-target': 'agentTarget', '--interval': 'intervalMs', '--state-file': 'stateFile' }[arg];
    if (!key || i + 1 >= argv.length) throw new Error(`invalid option: ${arg}`);
    args[key] = key === 'intervalMs' ? Number(argv[++i]) : argv[++i];
  }
  if (!args.repo || (!args.command && !args.agentTarget) || (args.command && args.agentTarget)) throw new Error('provide --repo and exactly one of --agent-target or --command');
  if (!Number.isInteger(args.intervalMs) || args.intervalMs < 100) throw new Error('--interval must be an integer >= 100');
  args.stateFile ??= `${args.repo}/.hunk-reviewer-state.json`;
  args.logger = console;
  return args;
}

try {
  const options = parseArgs(process.argv.slice(2));
  if (options.once) await poll(options);
  else {
    await poll(options);
    const watcher = startWatching(options);
    const stop = () => { watcher.stop(); process.exit(0); };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  }
} catch (error) {
  console.error(`hunk-reviewer: ${error.message}`);
  process.exit(1);
}
