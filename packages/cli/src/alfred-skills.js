// @flow
import Table from 'cli-table3';
import chalk from 'chalk';
import generateCtfFromConfig, {
  generateInterfaceStatesFromProject,
  loadConfigs
} from './helpers/CTF';

(async () => {
  const { alfredConfig } = await loadConfigs();

  const interfaceStateCtfs = await Promise.all(
    generateInterfaceStatesFromProject().map(interfaceState =>
      generateCtfFromConfig(alfredConfig, interfaceState).then(ctf =>
        Array.from(ctf.values()).filter(
          ctfNode =>
            ctfNode.hooks && ctfNode.interfaces && ctfNode.interfaces.length
        )
      )
    )
  );

  const map: Map<string, Set<string>> = new Map();
  const subcommandDict: Map<string, Object> = new Map();

  interfaceStateCtfs.forEach(interfaceStateCtf => {
    interfaceStateCtf.forEach(result => {
      result.interfaces.forEach(e => {
        subcommandDict.set(e.module.subcommand, e);
        if (map.has(e.module.subcommand)) {
          const set = map.get(e.module.subcommand);
          if (set) {
            set.add(result.name);
            map.set(e.module.subcommand, set);
          }
        } else {
          map.set(e.module.subcommand, new Set([result.name]));
        }
      });
    });
  });

  const table = new Table({
    head: [
      chalk.bold('Subcommand'),
      chalk.bold('Skills'),
      chalk.bold('Description')
    ],
    colWidths: [30, 30]
  });

  Array.from(map.entries()).forEach(([subcommand, skills]) => {
    const description = (() => {
      if (subcommandDict.has(subcommand)) {
        const interfaceForSubcommand = subcommandDict.get(subcommand);
        if (
          interfaceForSubcommand &&
          interfaceForSubcommand.module &&
          interfaceForSubcommand.module.description
        ) {
          return interfaceForSubcommand.module.description;
        }
      }
      return '';
    })();

    table.push([subcommand, Array.from(skills).join(', '), description]);
  });

  console.log(table.toString());
})();