// @flow
import lebab from 'lebab';
import { readFileAsync, writeFileAsync } from './';
import type { ProviderInput, ProviderInterface } from './ProviderInterface';

export default class LebabProvider implements ProviderInterface {
  /**
   * The list of transforms to apply
   * @todo: Add more transforms
   * @private
   */
  transforms = {
    safe: [
      'arrow',
      'for-of',
      'arg-spread',
      'obj-method',
      'obj-shorthand',
      'no-strict',
      'commonjs',
      'exponent',
      'multi-var'
    ],
    unsafe: [
      'let',
      'class',
      'template',
      'default-param',
      'includes'
    ]
  };

  providerName = 'lebab';

  /**
   * Should run before EslintProvider and PrettierProvider. Does not follow code
   * style convention. Only focuses on upgrading code. Not code style
   */
  priority = 1;

  safe = true;

  /**
   * @private
   */
  getTransforms(input: ProviderInput) {
    return input.unsafe === true
      ? [
        ...this.transforms.unsafe,
        ...this.transforms.safe
      ]
      : this.transforms.safe;
  }

  /**
   * @private
   */
  async transform(input: ProviderInput) {
    const { files, verbose } = input;
    await Promise.all(files.map(file =>
      readFileAsync(file)
        .then((buffer) => {
          const result = lebab.transform(
            buffer.toString(),
            this.getTransforms(input)
          );
          if (verbose && result.warnings.length > 0) {
            console.log(result.warnings);
          }
          return writeFileAsync(file, result.code);
        })));
  }

  async provide(input: ProviderInput): Promise<ProviderInput> {
    await this.transform(input);
    return input;
  }
}
