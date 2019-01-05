#!/usr/bin/env node
// @flow
import path from 'path';
import program from 'commander';
import Providers from './providers';

const parsedArguments = program
  .option('-u, --unsafe', 'allow unsafe transformations')
  .option('-v, --verbose', 'show verbose output')
  .option('-d, --debug', 'show debugging output')
  .parse(process.argv);

const filesPattern: Array<string> = parsedArguments.args.map(arg =>
  path.join(process.cwd(), arg)
);

// @TODO: Create backups from the files and pass the paths to the backups
//        instead of the actual filenames. Preserve the original filenames
//        if the migration was successful and we want to write to the original
//        files
Providers({
  files: filesPattern,
  packageJsonPath: path.join(process.cwd(), 'package.json'),
  unsafe: parsedArguments.unsafe,
  verbose: parsedArguments.verbose,
  write: parsedArguments.write
});