/* eslint import/no-dynamic-require: off, no-console: off, global-require: off */
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import rimraf from 'rimraf';
import Table from 'cli-table3';
import chalk from 'chalk';
import powerset from '@amilajack/powerset';
import childProcess from 'child_process';
import { INTERFACE_STATES } from '@alfred/core/lib/interface';
import { formatPkgJson } from '@alfred/core';
import { entrypointsToInterfaceStates } from '@alfred/core/lib/skill';
import mergeConfigs from '@alfred/merge-configs';
import { addEntrypoints } from '../../lib';
import Config from '@alfred/core/lib/config';
import { Env, ProjectEnum, Target } from '@alfred/types';
import { serialPromises } from '@alfred/helpers/lib';

process.on('unhandledRejection', err => {
  throw err;
});

// Goal: Test subcommands for all combinations of entrypoints and skills
// Create a ./tmp directory
// Start by having all the packages for the skills installed
// For each combination c[] of skills
//  consider c[] to be the skills. Add c[] to the skill
//    for each interfaceState in interfaceStates[9] (include all targets)
//      Default skills will automatically be added
//      Install the necessary deps
//      Run:
//       * lint
//       * format
//       * build
//       * build --dev
//       * build --prod
//       * start
//       * start --prod
//       * start --dev
//       * test
//       * skills
//      test with showConfigs: true
//      test with showConfigs: false

// If there are n elmenets in this array, 2^n tests will run since that's the number
// of total combinations of the elements in the array.
//
// @TODO Temporarily removed mocha because it was not compatible with browser env
const nonCoreCts = ['lodash', 'webpack', 'react'];

const scripts = [
  // Build
  'build',
  'build --prod',
  'build --dev',
  // Start
  // 'start',
  // 'start --prod',
  // 'start --dev',
  // Test
  'test',
  // Lint
  'lint',
  // Format
  'format'
];

const prodInterfaceStates = INTERFACE_STATES.filter(
  e => e.env === 'production'
);

type E2eTest = {
  skillCombination: string[];
  projectDir: string;
  env: NodeJS.ProcessEnv;
  binPath: string;
};

async function generateTestsForSkillCombination(
  skillCombination: string[],
  tmpDir: string
): Promise<E2eTest> {
  const folderName = ['e2e', ...skillCombination].join('-');
  const env = {
    ...process.env,
    ALFRED_E2E_CLI_TEST: 'true',
    ALFRED_IGNORE_INSTALL: 'true',
    ALFRED_CLI_E2E_TEST_INPUT: JSON.stringify({
      description: 'A fixture generated by alfred-e2e',
      repository: 'https://github.com/alfred-js/alfred',
      author: 'Self',
      email: 'johndoe@gmail.com',
      license: 'MIT',
      npmClient: 'NPM',
      projectType: 'lib',
      target: 'browser'
    })
  };
  const binPath = require.resolve('../../lib/commands/alfred');
  childProcess.execSync(`node ${binPath} new ${folderName}`, {
    cwd: tmpDir,
    stdio: 'inherit',
    env
  });
  const projectDir = path.join(tmpDir, folderName);

  // Add the skills to the alfred.skills config
  skillCombination.forEach(skill => {
    childProcess.execSync(`node ${binPath} learn @alfred/skill-${skill}`, {
      cwd: projectDir,
      stdio: 'inherit',
      env
    });
  });

  return { skillCombination, projectDir, env, binPath };
}

(async (): Promise<void> => {
  const tmpDir = path.join(__dirname, 'tmp');

  function cleanTmpDir(): void {
    rimraf.sync(tmpDir);
  }

  process.on('unhandledRejection', () => {
    cleanTmpDir();
  });
  process.on('exit', () => {
    cleanTmpDir();
  });

  cleanTmpDir();
  await fs.promises.mkdir(tmpDir);

  // Generate e2e tests for each combination of skills
  const e2eTests = await Promise.all(
    powerset(nonCoreCts)
      .sort((a, b) => a.length - b.length)
      // @TODO Instead of each interface state, generate tests from entrypointCombinations
      .map(skillCombination => (): Promise<E2eTest> =>
        generateTestsForSkillCombination(skillCombination, tmpDir)
      )
      .slice(0, parseInt(process.env.E2E_TEST_COUNT || '', 10) || undefined)
      .map(test => test())
  );

  childProcess.execSync('yarn --frozen-lockfile', {
    stdio: 'inherit'
  });

  const issues = [];

  await Promise.all(
    e2eTests.map(async ({ binPath, projectDir, skillCombination, env }) => {
      let command;

      // Generate all possible combinations of entrypoints and test each one
      const entrypointsCombinations = powerset(
        Array.from(
          new Set(
            prodInterfaceStates.map(interfaceState =>
              [interfaceState.projectType, interfaceState.target].join('.')
            )
          )
        )
      ).sort((a, b) => a.length - b.length);

      // Create a list of all subsets of the interface states like so:
      // [['lib.node'], ['lib.node', 'lib.browser'], etc...]
      await Promise.all(
        entrypointsCombinations.map(async entrypointCombination => {
          const templateData = {
            project: {
              name: {
                npm: {
                  full: 'foo'
                }
              },
              projectDir: './src/',
              env: 'development' as Env,
              projectType: 'lib' as ProjectEnum,
              target: 'browser' as Target
            }
          };

          // Generate interface states from the entrypoints
          const interfaceStates = entrypointsToInterfaceStates(
            entrypointCombination
          );
          // Remove the existing entrypoints in ./src
          rimraf.sync(path.join(projectDir, 'src/*'));
          rimraf.sync(path.join(projectDir, 'tests/*'));
          await addEntrypoints(templateData, projectDir, interfaceStates);

          await serialPromises(
            [true, false].map(showConfigs => async (): Promise<void> => {
              const pkg = mergeConfigs(
                {},
                require(path.join(projectDir, 'package.json')),
                {
                  alfred: {
                    ...Config.DEFAULT_CONFIG,
                    npmClient: 'yarn',
                    showConfigs
                  }
                }
              ) as {
                alfred: Config;
              };

              fs.writeFileSync(
                path.join(projectDir, 'package.json'),
                await formatPkgJson(pkg)
              );

              try {
                command = 'skills';
                childProcess.execSync(`node ${binPath} skills`, {
                  cwd: projectDir,
                  stdio: 'inherit',
                  env
                });

                console.log(
                  `Testing ${JSON.stringify({
                    skillCombination,
                    entrypointCombination,
                    showConfigs
                  })}`
                );

                const interfaceStateContainsAppProjectType = interfaceStates.some(
                  interfaceState => interfaceState.projectType === 'app'
                );

                await Promise.all(
                  scripts.map(async subcommand => {
                    command = subcommand;
                    try {
                      if (
                        interfaceStateContainsAppProjectType &&
                        subcommand.includes('start')
                      ) {
                        const start = childProcess.spawn(
                          binPath,
                          ['run', subcommand],
                          {
                            cwd: projectDir,
                            env
                          }
                        );

                        start.stdout.once('data', data => {
                          console.log(data);
                          start.kill();
                        });
                        start.stderr.once('data', data => {
                          start.kill();
                          throw new Error(data);
                        });
                      } else {
                        childProcess.execSync(
                          `node ${binPath} run ${subcommand}`,
                          {
                            cwd: projectDir,
                            stdio: 'inherit',
                            env
                          }
                        );
                      }
                      // Assert that the .configs dir should or should not exist
                      if (
                        path.join(projectDir, pkg.alfred.configsDir) !==
                        projectDir
                      ) {
                        assert.strictEqual(
                          fs.existsSync(
                            path.join(projectDir, pkg.alfred.configsDir)
                          ),
                          showConfigs
                        );
                      }
                    } catch (e) {
                      issues.push([
                        skillCombination.join(', '),
                        entrypointCombination.join(', '),
                        command,
                        showConfigs
                      ]);
                      console.log(e);
                    }
                  })
                );

                command = 'clean';
                childProcess.execSync(`node ${binPath} clean`, {
                  cwd: projectDir,
                  stdio: 'inherit',
                  env
                });
              } catch (e) {
                issues.push([
                  skillCombination.join(', '),
                  entrypointCombination.join(', '),
                  command,
                  showConfigs
                ]);
                console.log(e);
              }
            })
          );
        })
      );
    })
  );

  const totalTestsCount =
    // The total # of combinations of skills
    e2eTests.length *
    // The total # of combinations of interfaceStates
    (2 ** prodInterfaceStates.length - 1) *
    // The number of subcommands tested
    scripts.length *
    // Show Configs
    2;
  if (issues.length) {
    const table = new Table({
      head: [
        chalk.bold('Failing Skill Combinations'),
        chalk.bold('Entrypoints'),
        chalk.bold('Command'),
        chalk.bold('Show Configs')
      ]
    });
    issues.forEach(issue => {
      table.push(issue);
    });
    // Throw error and don't remove tmpDir so that it can be inspected after the tests
    throw new Error(
      [
        '',
        table.toString(),
        `❗️ ${issues.length} e2e tests failed`,
        `✅ ${totalTestsCount - issues.length} e2e tests passed`
      ].join('\n')
    );
  } else {
    console.log(`All ${totalTestsCount} e2e tests passed! Yayy 🎉 🎉 🎉`);
    cleanTmpDir();
  }
})();
