import SimpleSchema from "simpl-schema";
import { SchemaMap } from "../src/schema-map";

export const schemas: SchemaMap = {};

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
  }
});
