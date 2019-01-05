/* eslint no-restricted-syntax: off */
import path from 'path';
import powerset from '@amilajack/powerset';
import CTF, {
  CTFS,
  getConfigs,
  getDependencies,
  writeConfigsFromCtf,
  getDepsInstallCommand,
  getExecuteWrittenConfigsMethods
} from '@alfredpkg/core';

describe('CTF', () => {
  describe('executors', () => {
    let ctf;

    beforeAll(() => {
      ctf = new Map();
      ctf.set('webpack', CTFS.webpack);
    });

    it('should run simple executor', async () => {
      await writeConfigsFromCtf(ctf);
      const fixturePath = path.join('/', 'fixtures', 'test-alfred-app');
      const execDepsScript = getDepsInstallCommand(
        ['alfred-skill-webpack'],
        fixturePath
      );
      expect(execDepsScript).toMatchSnapshot();
    });

    it('should generate functions for scripts', () => {
      expect(getExecuteWrittenConfigsMethods(ctf)).toMatchSnapshot();
    });
  });

  // Generate tests for CTF combinations
  const ctfNamesCombinations = powerset(Object.keys(CTFS)).sort();
  for (const ctfCombination of ctfNamesCombinations) {
    it(`combination ${ctfCombination.join(',')}`, () => {
      expect(ctfCombination).toMatchSnapshot();
      // Get the CTFs for each combination
      const filteredCtfs = ctfCombination.map(ctfName => CTFS[ctfName]);
      const result = CTF(filteredCtfs);
      expect(getConfigs(result)).toMatchSnapshot();
      expect(getDependencies(result)).toMatchSnapshot();
    });
  }
});