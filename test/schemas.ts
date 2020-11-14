import SimpleSchema from "simpl-schema";
import { SchemaMap, allowSchemaExtension } from "../src/schema-map";
import { MyEnum } from "./models/model";

export const schemas: SchemaMap = {};
allowSchemaExtension();

schemas["SubType"] = new SimpleSchema({
  aNumber: {
    type: Number,
    min: 12,
    max: 14.5
  }
});

schemas["Foo"] = new SimpleSchema({
  aSpecificField: schemas["SubType"],
  anArrayOfBooleans: {
    type: Array
  },
  "anArrayOfBooleans.$": {
    type: Boolean
  },
  aDate: {
    type: Date,
    optional: true,
    // Not used for the moment
    autoValue: () => new Date()
  },
  aString: {
    type: String,
    // Not used for the moment
    defaultValue: "schemas"
  },
  anEnum: {
    type: MyEnum,
    optional: true
  },
  anEnumWithType: {
    type: MyEnum,
    // @ts-ignore
    typeName: 'MyEnum'
  }
});
