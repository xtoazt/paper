#!/usr/bin/env node

/**
 * Paper CLI
 * Command-line interface for deploying to Paper Network
 */

import { Command } from 'commander';
import { deployCommand } from './commands/deploy.js';
import { loginCommand } from './commands/login.js';
import { initCommand } from './commands/init.js';
import { logsCommand } from './commands/logs.js';
import { dbCommand } from './commands/db.js';
import { envCommand } from './commands/env.js';
import { scaleCommand } from './commands/scale.js';
import { domainsCommand } from './commands/domains.js';

const program = new Command();

program
  .name('paper')
  .description('Paper Network CLI - Deploy to the decentralized web')
  .version('1.0.0');

// Login command
program
  .command('login')
  .description('Login to Paper Network (generates PKARR keypair)')
  .action(loginCommand);

// Init command
program
  .command('init')
  .description('Initialize a Paper project in the current directory')
  .action(initCommand);

// Deploy command
program
  .command('deploy')
  .description('Deploy current directory to Paper Network')
  .option('-p, --project <name>', 'Project name')
  .option('--prod', 'Deploy to production')
  .action(deployCommand);

// Logs command
program
  .command('logs <app>')
  .description('View logs for an application')
  .option('-f, --follow', 'Follow log output')
  .option('-n, --lines <number>', 'Number of lines to show', '100')
  .action(logsCommand);

// Database commands
const db = program
  .command('db')
  .description('Manage databases');

db.command('create <name> <type>')
  .description('Create a new database (postgres, mongodb, redis)')
  .action(dbCommand.create);

db.command('list')
  .description('List all databases')
  .action(dbCommand.list);

db.command('connect <name>')
  .description('Get connection string for a database')
  .action(dbCommand.connect);

db.command('delete <name>')
  .description('Delete a database')
  .action(dbCommand.delete);

// Environment variable commands
const env = program
  .command('env')
  .description('Manage environment variables');

env.command('set <key> <value>')
  .description('Set an environment variable')
  .option('-p, --project <name>', 'Project name')
  .action(envCommand.set);

env.command('list')
  .description('List all environment variables')
  .option('-p, --project <name>', 'Project name')
  .action(envCommand.list);

env.command('delete <key>')
  .description('Delete an environment variable')
  .option('-p, --project <name>', 'Project name')
  .action(envCommand.delete);

// Scale command
program
  .command('scale <app>')
  .description('Scale an application')
  .option('--instances <number>', 'Number of instances', '1')
  .action(scaleCommand);

// Domains commands
const domains = program
  .command('domains')
  .description('Manage domains');

domains.command('add <app> <domain>')
  .description('Add a custom domain to an app')
  .action(domainsCommand.add);

domains.command('list <app>')
  .description('List domains for an app')
  .action(domainsCommand.list);

domains.command('remove <app> <domain>')
  .description('Remove a domain from an app')
  .action(domainsCommand.remove);

// Parse arguments
program.parse();
