/* eslint import/no-dynamic-require: off, @typescript-eslint/ban-ts-ignore: off */
import lodash from 'lodash';
import mergeConfigs from '@alfred/merge-configs';
import {
  ConfigInterface,
  CtfMap,
  CtfNode,
  ProjectInterface,
  InterfaceState,
  ConfigWithResolvedSkills,
  ConfigWithUnresolvedInterfaces,
  ConfigFile,
  ProjectEnum,
  Target,
  CtfWithHelpers,
  Dependencies,
  OrderedCtfTransforms,
  OrderedCtfTransformsMap,
  Transforms
} from '@alfred/types';
import topsort from './topsort';
import Config from './config';
import { normalizeInterfacesOfSkill, INTERFACE_STATES } from './interface';

const jestCtf = require('@alfred/skill-jest');
const babel = require('@alfred/skill-babel');
const webpack = require('@alfred/skill-webpack');
const eslint = require('@alfred/skill-eslint');
const react = require('@alfred/skill-react');
const prettier = require('@alfred/skill-prettier');
const parcel = require('@alfred/skill-parcel');
const rollup = require('@alfred/skill-rollup');
const lodashCtf = require('@alfred/skill-lodash');

type CORE_CTF =
  | 'babel'
  | 'webpack'
  | 'parcel'
  | 'eslint'
  | 'prettier'
  | 'jest'
  | 'react'
  | 'rollup'
  | 'lodash';

function addCtfHelpers(ctf: CtfNode): CtfWithHelpers {
  return {
    ...ctf,
    findConfig(configName: string): ConfigFile {
      const config = this.configFiles.find(
        configFile => configFile.name === configName
      );
      if (!config) {
        throw new Error(`Cannot find config with name "${configName}"`);
      }
      return config;
    },
    extendConfig(
      configName: string,
      configExtension: { [x: string]: string } = {}
    ): CtfWithHelpers {
      const foundConfig = this.findConfig(configName);
      const mergedConfigFile = mergeConfigs({}, foundConfig, {
        config: configExtension
      });
      const configFiles = this.configFiles.map(configFile =>
        configFile.name === configName ? mergedConfigFile : configFile
      );
      return lodash.merge({}, this, {
        configFiles
      });
    },
    replaceConfig(
      configName: string,
      configReplacement: ConfigFile
    ): CtfWithHelpers {
      const configFiles = this.configFiles.map(configFile =>
        configFile.name === configName ? configReplacement : configFile
      );
      return {
        ...this,
        configFiles
      };
    },
    addDependencies(dependencies: Dependencies): CtfWithHelpers {
      return lodash.merge({}, this, {
        dependencies
      });
    },
    addDevDependencies(devDependencies: Dependencies): CtfWithHelpers {
      return lodash.merge({}, this, {
        devDependencies
      });
    }
  };
}

function normalizeCtf(ctf: CtfNode): CtfWithHelpers {
  return {
    ...addCtfHelpers(ctf),
    interfaces: normalizeInterfacesOfSkill(ctf.interfaces)
  };
}

export const CORE_CTFS: { [ctf in CORE_CTF]: CtfWithHelpers } = {
  babel: normalizeCtf(babel),
  webpack: normalizeCtf(webpack),
  parcel: normalizeCtf(parcel),
  eslint: normalizeCtf(eslint),
  prettier: normalizeCtf(prettier),
  jest: normalizeCtf(jestCtf),
  react: normalizeCtf(react),
  rollup: normalizeCtf(rollup),
  lodash: normalizeCtf(lodashCtf)
};

// Examples
// 'lib.node.js',
// 'app.node.js',
// 'lib.browser.js',
// 'app.browser.js'
// etc...
export const ENTRYPOINTS = [
  'lib.node.js',
  'app.node.js',
  'lib.browser.js',
  'app.browser.js'
];

/**
 * Convert entrypoints to interface states
 */
export function entrypointsToInterfaceStates(
  entrypoints: Array<string>
): Array<InterfaceState> {
  return entrypoints.map(entrypoint => {
    const [projectType, target] = entrypoint.split('.') as [
      ProjectEnum,
      Target
    ];
    return { projectType, target, env: 'production' };
  });
}

/**
 * Topologically sort the CTFs
 */
export function topsortCtfMap(ctfMap: CtfMap): Array<string> {
  const topsortGraphEdges: Array<[string, string]> = [];
  const ctfNodeNames = new Set(ctfMap.keys());

  ctfMap.forEach(ctfNode => {
    if (ctfNode.ctfs) {
      Object.keys(ctfNode.ctfs).forEach(ctfFnName => {
        if (ctfNodeNames.has(ctfFnName)) {
          topsortGraphEdges.push([ctfNode.name, ctfFnName]);
        }
      });
    }
  });

  const sortedCtfNames = topsort(topsortGraphEdges);
  ctfMap.forEach(e => {
    if (!sortedCtfNames.includes(e.name)) {
      sortedCtfNames.push(e.name);
    }
  });

  return sortedCtfNames;
}

export function callCtfsInOrder(
  project: ProjectInterface,
  ctf: CtfMap,
  interfaceState: InterfaceState
): { ctf: CtfMap; orderedSelfTransforms: OrderedCtfTransforms } {
  const { config } = project;
  const topologicallyOrderedCtfs = topsortCtfMap(ctf);

  // All the ctfs Fns from other ctfNodes that transform each ctfNode
  const selfTransforms: OrderedCtfTransformsMap = new Map(
    topsortCtfMap(ctf).map(e => [e, []])
  );

  ctf.forEach(ctfNode => {
    Object.entries(ctfNode.ctfs || {}).forEach(([ctfName, ctfFn]) => {
      if (ctf.has(ctfName)) {
        const fn = (): void => {
          const correspondingCtfNode = ctf.get(ctfName) as CtfNode;
          ctf.set(
            ctfName,
            ctfFn(correspondingCtfNode, ctf, {
              project,
              config,
              ...interfaceState
            })
          );
        };
        selfTransforms.get(ctfName)?.push(fn);
      }
    });
  });

  const orderedSelfTransforms: OrderedCtfTransforms = topologicallyOrderedCtfs.map(
    e => selfTransforms.get(e) as Transforms
  );

  orderedSelfTransforms.forEach(selfTransform => {
    selfTransform?.forEach(_selfTransform => {
      _selfTransform();
    });
  });

  return { ctf, orderedSelfTransforms };
}

export function validateCtf(
  ctf: CtfMap,
  interfaceState: InterfaceState
): CtfMap {
  ctf.forEach(ctfNode => {
    if (ctfNode && ctfNode.supports) {
      const supports = {
        env: ctfNode.supports.env.includes(interfaceState.env),
        target: ctfNode.supports.targets.includes(interfaceState.target),
        projectType: ctfNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;

      if (!isSupported) {
        throw new Error(
          `The "${ctfNode.name}" skill, which supports ${JSON.stringify(
            ctfNode.supports
          )}}, does not support the current environment, project type, or target, which are ${JSON.stringify(
            interfaceState
          )}`
        );
      }
    }
  });

  // Check if the CTF's can be topsorted
  topsortCtfMap(ctf);

  return ctf;
}

/**
 * Add skills to a given list of skills to ensure that the list has a complete set
 * of standard ctfs. Also remove skills that do not support the current interfaceState
 */
export function CTF(
  project: ProjectInterface,
  ctfs: Array<CtfNode>,
  interfaceState: InterfaceState
): Map<string, CtfWithHelpers> {
  const ctfMap: Map<string, CtfWithHelpers> = new Map();

  ctfs
    .map(normalizeCtf)
    .forEach(
      (
        ctfWithHelpers: CtfWithHelpers,
        _,
        ctfsWithHelpers: CtfWithHelpers[]
      ) => {
        if (ctfWithHelpers.interfaces.length) {
          ctfWithHelpers.interfaces.forEach(e => {
            if (
              'resolveSkill' in e.module &&
              typeof e.module.resolveSkill === 'function'
            ) {
              if (
                e.module.resolveSkill(ctfsWithHelpers, interfaceState) !== false
              ) {
                ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
              }
            } else {
              ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
            }
          });
        } else {
          ctfMap.set(ctfWithHelpers.name, ctfWithHelpers);
        }
      }
    );

  // Remove skills that do not support the current interfaceState
  const ctfNodesToBeRemoved: Array<string> = [];
  ctfMap.forEach(ctfNode => {
    if (ctfNode && ctfNode.supports) {
      const supports = {
        env: ctfNode.supports.env.includes(interfaceState.env),
        target: ctfNode.supports.targets.includes(interfaceState.target),
        projectType: ctfNode.supports.projectTypes.includes(
          interfaceState.projectType
        )
      };
      const { env, target, projectType } = supports;
      const isSupported = env && target && projectType;
      if (!isSupported) {
        ctfNodesToBeRemoved.push(ctfNode.name);
      }
    }
  });
  ctfNodesToBeRemoved.forEach(ctfNodeName => {
    ctfMap.delete(ctfNodeName);
  });

  // Create a set of standard skills
  const defaultCtfsMap = new Map([
    ['lint', CORE_CTFS.eslint],
    ['format', CORE_CTFS.prettier],
    [
      'build',
      require('@alfred/interface-build').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      )
    ],
    [
      'start',
      require('@alfred/interface-start').resolveSkill(
        Object.values(CORE_CTFS),
        interfaceState
      )
    ],
    ['test', CORE_CTFS.jest]
  ]);

  const defaultSubCommands: Set<string> = new Set(defaultCtfsMap.keys());
  // Create a set of subcommands that the given CTF has
  const ctfSubcommands: Set<string> = Array.from(ctfMap.values()).reduce(
    (prev: Set<string>, ctfNode: CtfNode) => {
      if (ctfNode.interfaces && ctfNode.interfaces.length) {
        ctfNode.interfaces.forEach(_interface => {
          const { subcommand } = _interface.module;
          prev.add(subcommand);
        });
      }
      return prev;
    },
    new Set()
  );

  defaultSubCommands.forEach(defaultSubCommand => {
    if (!ctfSubcommands.has(defaultSubCommand)) {
      const defaultCtfToAdd = defaultCtfsMap.get(defaultSubCommand);
      ctfMap.set(defaultCtfToAdd.name, defaultCtfToAdd);
    }
  });

  // Add all the CORE_CTF's without subcommands
  // @HACK
  if (!ctfMap.has('babel')) {
    ctfMap.set('babel', CORE_CTFS.babel);
  }

  callCtfsInOrder(project, ctfMap, interfaceState);

  validateCtf(ctfMap, interfaceState);

  return ctfMap;
}

/**
 * 1. Add default skills to CTF
 * 2. Validate CTF
 * 3. Run CTF transformations
 */
export default async function ctfFromConfig(
  project: ProjectInterface,
  interfaceState: InterfaceState,
  config: ConfigInterface = project.config
): Promise<CtfMap> {
  // Generate the CTF
  const ctfMapFromConfigSkills: CtfMap = new Map();

  config.skills.forEach(([skillPkgName, skillUserConfig]) => {
    // Add the skill config to the ctfNode
    const ctfNode: CtfNode = require(skillPkgName);
    ctfNode.config = skillUserConfig;
    if (ctfNode.configFiles) {
      ctfNode.configFiles = ctfNode.configFiles.map(configFile => ({
        ...configFile,
        config: mergeConfigs(
          {},
          configFile.config,
          // Only apply config if skill has only one config file
          ctfNode.configFiles.length === 1 ? skillUserConfig : {}
        )
      }));
    }
    ctfMapFromConfigSkills.set(ctfNode.name, ctfNode);
  });

  return CTF(
    project,
    Array.from(ctfMapFromConfigSkills.values()),
    interfaceState
  );
}

/**
 * Intended to be used for testing purposes
 */
export function getDependencies(ctf: CtfMap): Dependencies {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.dependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

export function getDevDependencies(ctf: CtfMap): Dependencies {
  return Array.from(ctf.values())
    .map(ctfNode => ctfNode.devDependencies || {})
    .reduce((p, c) => ({ ...p, ...c }), {});
}

/**
 * Find all the dependencies that are different between two CTF's.
 * This is used to figure out which deps need to be installed by
 * finding which dependencies have changed in the package.json
 *
 * Find all the elements such that are (A ⩃ B) ⋂ B
 * where A is old ctf and B is new ctf
 */
export function diffCtfDeps(oldCtf: CtfMap, newCtf: CtfMap): Array<string> {
  const oldCtfMap: Map<string, string> = new Map(
    Object.entries(getDevDependencies(oldCtf))
  );
  const diffDeps = new Map();

  Object.entries(getDevDependencies(newCtf)).forEach(([dependency, semver]) => {
    if (oldCtfMap.has(dependency)) {
      if (oldCtfMap.get(dependency) !== semver) {
        throw new Error('Cannot resolve diff deps');
      }
    } else {
      diffDeps.set(dependency, semver);
    }
  });

  return Array.from(diffDeps.entries()).map(
    ([dependency, semver]) => `${dependency}@${semver}`
  );
}

export async function diffCtfDepsOfAllInterfaceStates(
  project: ProjectInterface,
  prevConfig:
    | ConfigWithResolvedSkills
    | ConfigInterface
    | ConfigWithUnresolvedInterfaces,
  currConfig:
    | ConfigWithResolvedSkills
    | ConfigInterface
    | ConfigWithUnresolvedInterfaces
): Promise<Array<string>> {
  const interfaceStatesWithDupeDeps = await Promise.all(
    INTERFACE_STATES.map(interfaceState =>
      Promise.all([
        ctfFromConfig(project, interfaceState, new Config(prevConfig)),
        ctfFromConfig(project, interfaceState, new Config(currConfig))
      ])
    )
  );

  const diffDeps = interfaceStatesWithDupeDeps
    .map(([a, b]) => diffCtfDeps(a, b))
    .flat();

  return Array.from(new Set(diffDeps));
}