/* eslint no-restricted-syntax: off, import/no-extraneous-dependencies: off, guard-for-in: off, no-param-reassign: off */
import os from 'os';
import path from 'path';
import powerset from '@amilajack/powerset';
import { getConfigs } from '@alfred/helpers';
import { InterfaceState, CtfMap, Dependencies } from '@alfred/types';
import {
  getExecutableWrittenConfigsMethods,
  getInterfaceForSubcommand
} from '../src/commands';
import ctfFromConfig, {
  CORE_CTFS,
  CTF,
  addCtfHelpers,
  runCtfs
} from '../src/ctf';
import { normalizeInterfacesOfSkill, INTERFACE_STATES } from '../src/interface';
import Project from '../src/project';

/**
 * Intended to be used for testing purposes
 */
function getDependencies(ctf: CtfMap): Dependencies {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

function getDevDependencies(ctf: CtfMap): Dependencies {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

const parcel = require('@alfred/skill-parcel');

const [defaultInterfaceState] = INTERFACE_STATES;

const defaultProject = new Project(
  path.join(__dirname, '../../cli/tests/fixtures/app')
);

function removePathsPropertiesFromObject(
  obj:
    | Array<any>
    | {
        [x: string]: string | Record<string, any>;
      }
): Record<string, any> {
  for (const key in obj) {
    const value = obj[key];

    if (typeof value === 'object') {
      removePathsPropertiesFromObject(value);
    }

    if (typeof value === 'string' && value.includes(os.homedir())) {
      obj[key] = '/';
    }
  }
  return obj;
}

describe('CTF', () => {
  describe('order', () => {
    it('should run ctfs in order', () => {
      const ctfMap = new Map([
        [
          'react',
          {
            name: 'react',
            configFiles: [
              {
                name: 'eslint',
                path: '.eslintrc.json',
                write: true,
                config: {
                  plugins: []
                }
              }
            ],
            ctfs: {
              babel(ctf) {
                ctf.configFiles[0].config.plugins.push('a');
                return ctf;
              },
              eslint(ctf) {
                ctf.configFiles[0].config.plugins.push('b');
                return ctf;
              }
            }
          }
        ],
        [
          'eslint',
          {
            name: 'eslint'
          }
        ],
        [
          'babel',
          {
            name: 'babel'
          }
        ]
      ]);
      expect(
        runCtfs(defaultProject, ctfMap).get('react').configFiles[0].config
      ).toEqual({
        plugins: ['a', 'b']
      });
    });
  });

  describe('interfaces', () => {
    it('should allow falsy inputs', () => {
      expect(normalizeInterfacesOfSkill(undefined)).toEqual([]);
      expect(normalizeInterfacesOfSkill(undefined)).toEqual([]);
    });

    it('should allow array of strings input', () => {
      expect(
        normalizeInterfacesOfSkill(['@alfred/interface-build'])
      ).toMatchSnapshot();
      expect(
        normalizeInterfacesOfSkill([
          '@alfred/interface-build',
          '@alfred/interface-start'
        ])
      ).toMatchSnapshot();
    });

    it('should not allow non-array or string inputs', () => {
      expect(() =>
        normalizeInterfacesOfSkill({
          '@alfred/interface-build': {},
          '@alfred/interface-start': {}
        })
      ).toThrowErrorMatchingSnapshot();
      expect(() =>
        normalizeInterfacesOfSkill('incorrect-input')
      ).toThrowErrorMatchingSnapshot();
    });

    describe('subcommand', () => {
      INTERFACE_STATES.forEach(interfaceState => {
        it(`should get corresponding interface for interface state ${JSON.stringify(
          interfaceState
        )}`, () => {
          expect(
            getInterfaceForSubcommand(
              CTF(defaultProject, Object.values(CORE_CTFS), interfaceState),
              'build'
            )
          ).toMatchSnapshot();
        });
      });

      it('should error if subcommand does not exist', () => {
        INTERFACE_STATES.forEach(interfaceState => {
          expect(() =>
            getInterfaceForSubcommand(
              CTF(defaultProject, [CORE_CTFS.babel], interfaceState),
              'foo'
            )
          ).toThrow();
        });
      });
    });
  });

  describe('executors', () => {
    it('should generate functions for scripts', () => {
      INTERFACE_STATES.forEach(interfaceState => {
        const ctf = CTF(defaultProject, [CORE_CTFS.parcel], interfaceState);
        expect(
          getExecutableWrittenConfigsMethods(
            defaultProject,
            ctf,
            interfaceState
          )
        ).toMatchSnapshot();
      });
    });
  });

  describe('ctf helpers', () => {
    describe('adding deps from pkg', () => {
      const defaultPkg = {
        devDependencies: {
          foo: '1.1.1'
        }
      };
      it('should add deps from pkg', () => {
        expect(
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg('foo', defaultPkg)
        ).toHaveProperty('devDependencies');
        expect(
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg('foo', defaultPkg)
            .devDependencies
        ).toHaveProperty('foo', '1.1.1');
      });

      it('should support different deps types', () => {
        const pkg = {
          peerDependencies: {
            foo: '1.1.1'
          }
        };
        expect(
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg('foo', pkg, 'peer')
        ).toHaveProperty('devDependencies');
        expect(
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg('foo', pkg, 'peer')
            .devDependencies
        ).toHaveProperty('foo', '1.1.1');
        expect(
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg(
            'foo',
            defaultPkg,
            'dev',
            'peer'
          )
        ).toHaveProperty('peerDependencies');
        expect(
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg(
            'foo',
            defaultPkg,
            'dev',
            'peer'
          ).peerDependencies
        ).toHaveProperty('foo', '1.1.1');
      });

      it('should throw on unresolved pkg', () => {
        expect(() =>
          addCtfHelpers(CORE_CTFS.babel).addDepsFromPkg('foo', {})
        ).toThrow(
          'Package "foo" does not exist in devDependencies of skill package.json'
        );
      });
    });
  });

  describe('alfred cli helpers', () => {
    it('should add missing std skills to ctf', async () => {
      {
        const interfaceState = {
          env: 'production',
          projectType: 'app',
          target: 'browser'
        } as InterfaceState;
        const ctf = CTF(defaultProject, [parcel], interfaceState);
        const ctfSkillNames = Array.from(ctf.keys());
        expect(ctfSkillNames).toMatchSnapshot();
        expect(ctfSkillNames).toContain('parcel');
        expect(ctfSkillNames).not.toContain('rollup');
        expect(ctfSkillNames).not.toContain('webpack');
      }
      {
        const interfaceState = {
          env: 'production',
          projectType: 'lib',
          target: 'browser'
        } as InterfaceState;
        const ctf = CTF(defaultProject, [parcel], interfaceState);
        const ctfSkillNames = Array.from(ctf.keys());
        expect(ctfSkillNames).toMatchSnapshot();
        expect(ctfSkillNames).toContain('rollup');
        expect(ctfSkillNames).not.toContain('parcel');
        expect(ctfSkillNames).not.toContain('webpack');
      }
    });

    describe('skills', () => {
      it('should throw if skill does not exist', async () => {
        const [state] = INTERFACE_STATES;
        const project = {
          root: '',
          config: {
            ...defaultProject.config,
            skills: [['@alfred/skill-non-existent-skill', {}]]
          }
        };
        await expect(
          ctfFromConfig(project, state, project.config)
        ).rejects.toThrow(
          "Cannot find module '@alfred/skill-non-existent-skill' from 'index.js'"
        );
      });

      it('should throw if unsupported skill is used', async () => {
        const [state] = INTERFACE_STATES;
        const project = {
          config: {
            ...defaultProject.config,
            skills: [['@alfred/skill-non-existent-skill', {}]]
          }
        };
        await expect(
          ctfFromConfig(project, state, project.config)
        ).rejects.toThrow(
          "Cannot find module '@alfred/skill-non-existent-skill' from 'index.js'"
        );
      });
    });

    it('should override core ctf skills that support same interface states', async () => {
      const interfaceState = {
        env: 'production',
        projectType: 'app',
        target: 'browser'
      } as InterfaceState;
      const ctf = CTF(defaultProject, [parcel], interfaceState);
      const ctfSkillNames = Array.from(ctf.keys());
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).toContain('parcel');
      expect(ctfSkillNames).not.toContain('rollup');
      expect(ctfSkillNames).not.toContain('webpack');
    });

    it('should not use CTF skills that do not support current interface state', async () => {
      const interfaceState = {
        env: 'production',
        projectType: 'lib',
        target: 'browser'
      } as InterfaceState;
      const ctf = CTF(defaultProject, [parcel], interfaceState);
      const ctfSkillNames = Array.from(ctf.keys());
      expect(ctfSkillNames).toMatchSnapshot();
      expect(ctfSkillNames).not.toContain('parcel');
      expect(ctfSkillNames).toContain('rollup');
      expect(ctfSkillNames).not.toContain('webpack');
    });
  });

  // Generate tests for CTF combinations
  const ctfNamesCombinations = powerset(Object.keys(CORE_CTFS)).sort();
  for (const ctfCombination of ctfNamesCombinations) {
    INTERFACE_STATES.forEach(interfaceState => {
      it(`combination ${ctfCombination.join(
        ','
      )} interface state ${JSON.stringify(defaultInterfaceState)}`, () => {
        expect(ctfCombination).toMatchSnapshot();
        // Get the CTFs for each combination
        const ctfObjects = ctfCombination.map(ctfName => CORE_CTFS[ctfName]);
        const ctfMap = CTF(defaultProject, ctfObjects, interfaceState);
        expect(
          removePathsPropertiesFromObject(getConfigs(ctfMap))
        ).toMatchSnapshot();
        expect(getDependencies(ctfMap)).toMatchSnapshot();
        expect(getDevDependencies(ctfMap)).toMatchSnapshot();
      });
    });
  }

  INTERFACE_STATES.forEach(interfaceState => {
    it(`should add devDepencencies with interface state ${JSON.stringify(
      interfaceState
    )}`, () => {
      const { devDependencies } = CTF(
        defaultProject,
        Object.values(CORE_CTFS),
        interfaceState
      )
        .get('parcel')
        .addDevDependencies({
          foobar: '0.0.0'
        });
      expect(devDependencies).toMatchSnapshot();
    });
  });
});
