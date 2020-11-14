import { default as SimpleSchema } from "simpl-schema";

// Allow to explicitly define the type name to help type generation
SimpleSchema.extendOptions(["typeName"]);

export { default as SimpleSchema } from "simpl-schema";

export type SchemaMap = { [typeName: string]: SimpleSchema };
