// @flow
import Joi from 'joi';

/**
 * @TODO Move this to core/configs
 */
export default function Validate(alfredPkg: { [x: string]: any }) {
  // @TODO Move to helpers
  const schema = Joi.object().keys({
    showConfigs: Joi.boolean(),
    extends: [Joi.string(), Joi.array().items(Joi.string())],
    skills: Joi.array().items(Joi.string()),
    app: Joi.object().keys({
      targets: Joi.any()
    }),
    lib: Joi.object().keys({
      recommendSkills: Joi.array().items(Joi.string())
    })
  });
  return Joi.assert(alfredPkg, schema);
}