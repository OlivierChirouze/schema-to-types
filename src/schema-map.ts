import SimpleSchema from "simpl-schema";

export type SchemaMap = { [typeName: string]: SimpleSchema };

// Allow to explicitly define the type name to help type generation
export const allowSchemaExtension = () =>
  SimpleSchema.extendOptions(["typeName"]);
