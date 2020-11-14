# schema-to-types
Library to generate TypeScript types based on simpl-schema definitions

## Usage

### Define the schemas

Define all your schemas as values of a single object with type `SchemaMap` and export it.

The **keys** of the object will be used as name of the generated **types**.

Example:

```typescript
export const schemas: SchemaMap = {};

// Will generate interface Foo
schemas["Foo"] = new SimpleSchema({
  anArrayOfBooleans: {
    type: Array
  },
  "anArrayOfBooleans.$": {
    type: Boolean
  },
  aDate: {
    type: Date,
    optional: true,
    autoValue: () => new Date()
  },
  aString: {
    type: String,
    defaultValue: "schemas"
  }
});
```

Will generate:

```typescript
export interface Foo {
    anArrayOfBooleans: boolean[];
    aDate?: Date;
    aString: string;
}
```

### Generate types
For the moment this is very basic: the project must be checked out and ran locally via `update-model.ts` script,
providing path to `tsconfig` and the file that will contain the generated types.

Example:

```shell script
ts-node src/update-model.ts tsconfig.json example/models/generated-model.ts
```

## Details

### Schema references

To reference another schema, simply reference it via its key in the schemas object.

```typescript
schemas["SubType"] = new SimpleSchema({
  aNumber: {
    type: Number,
    min: 12,
    max: 14.5
  }
});

schemas["Foo"] = new SimpleSchema({
  aSpecificField: schemas["SubType"], // Will target the other type
});
```

### Enum references

When an enum is used as a `type` in your schema, it will be "deconstructed" as the list of possible values.

Except... if you provide the specific `typeName` attribute.

For this to be accepted by `Simple-schema`, you will need to import `allowSchemaExtension` and call it.

Example

```typescript
import { SchemaMap, allowSchemaExtension } from "../src/schema-map";
import { MyEnum } from "./models/model";

export const schemas: SchemaMap = {};
allowSchemaExtension(); // Needed for typeName to be accepted

schemas["TypeWithEnumus"] = new SimpleSchema({
  anEnum: {
    type: MyEnum, // Will generate the list of possible values
    optional: true
  },
  anEnumWithType: {
    type: MyEnum,
    typeName: 'MyEnum' // Will reference MyEnum type directly
  }
});
```

## Example
To test the tool, look at `/example` dir and run

```shell script
npm run generate-test-model
```

## Caveats

- not all possible schema definitions have been implemented or tested
- very unefficient code
- would be nice to not rely on `typeName` for external references
- not convenient: should be packaged as a npm package
