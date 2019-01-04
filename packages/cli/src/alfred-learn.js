#!/usr/bin/env node
// @flow
import program from 'commander';
import path from 'path';
import fs from 'fs';
import childProcess from 'child_process';
import {
  getDepsInstallCommand,
  writeConfigsFromCtf,
  CTFS
} from '@alfredpkg/core';
import type { CtfMap } from '@alfredpkg/core';

(async () => {
  const parsedArguments = program.parse(process.argv);
  const { args: skills } = parsedArguments;

  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error('Project does not have "package.json"');
  }

  const pkg = await fs.promises.readFile(pkgJsonPath);
  const parsedPkg = JSON.parse(pkg.toString());
  const { dependencies = {} } = parsedPkg;

  // Check if a skill with the same interface is already being used.
  // If so, uninstall it
  // skills.forEach(skill => {
  // });

  // Install skills
  childProcess.execSync(
    `npm install ${skills.join(' ')} --prefix ${process.cwd()}`,
    {
      stdio: [0, 1, 2]
    }
  );

  // Generate the CTF
  const ctf: CtfMap = new Map();
  Object.keys(dependencies || {})
    .filter(dep => dep.includes('alfred-skill-'))
    .map(dep => dep.substring('alfred-skill-'.length))
    .forEach(dep => {
      if (!(dep in CTFS)) {
        throw new Error(`CTF "${dep}" does not exist`);
      }
      ctf.set(dep, CTFS[dep]);
    });

  // Then install the skill/s
  const configsPath = path.join(process.cwd(), '.configs');
  const installScript = getDepsInstallCommand(ctf, configsPath);
  childProcess.execSync(installScript, { stdio: [0, 1, 2] });

  if (!('alfred' in parsedPkg)) {
    throw new Error('No configs in "package.json"');
  }

  const { skills: configSkills = [] } = parsedPkg.alfred;
  const dedupedSkills = Array.from(new Set([...configSkills, ...skills]));
  await fs.promises.writeFile(pkgJsonPath, {
    ...parsedPkg,
    alfred: {
      ...parsedPkg.alfred,
      skills: dedupedSkills
    }
  });

  // Then update the Alfred config by adding the skill to `skills` array
  writeConfigsFromCtf(ctf);
  // Then persist the resulting configs of the CTFs to ./node_modules/.configs or ./configs
})();
