# schema-to-types
Library to generate TypeScript types based on [simpl-schema](https://github.com/aldeed/simpl-schema) definitions

## Usage

### Install
```shell script
npm install --save-dev schema-to-types
```

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
Very basic for the moment: run `update-model.ts` script,
providing path to `tsconfig` and the file that will contain the generated types.

Example:

```shell script
node node_modules/schema-to-types/dist/src/update-model.js tsconfig.json api/imports/model/schema-model.ts
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
  aSubObject: schemas["SubType"], // Will target the other type
});
```

Will generate:

```typescript
export interface SubType {
    aNumber: number;
}

export interface Foo {
    aSubObject: SubType;
}
```


### Enum references

When an enum is used as a `type` in your schema, it will be "deconstructed" as the list of possible values.

Except... if you provide the specific `typeName` attribute.

For this to be accepted by `Simple-schema`, you will need to allow it:

```typescript
SimpleSchema.extendOptions(["typeName"]);
```

Example

```typescript
import { SchemaMap } from "../src/schema-map";
import { MyEnum } from "./models/model";

// Essential to be allowed to use typeName property and reference types explicitly
SimpleSchema.extendOptions(["typeName"]);

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

### Type references

To reference a *type* instead of the native types (such as `String`):

1. explicitely name it with the `typeName` property (see above)
2. trick the reference in `type` property to make sure **the type is imported in the file** (mandatory for the code generation to reference it)

Example

Let's assume an Id type has been defined in `model/model.ts`:

````typescript
export type Id = string;
````

In the schema file:

```typescript
import { SchemaMap, allowSchemaExtension } from "../src/schema-map";
import { Id } from "./models/model";

// Essential to be allowed to use typeName property and reference types explicitly
SimpleSchema.extendOptions(["typeName"]);

schemas["TypeWithTypedString"] = new SimpleSchema({
  aTypedString: {
      type: String as (value?: any) => Id, // To make sure Id is imported
      typeName: "Id"
    },
});
```

This way the library will use `Id` instead of `string` in the generated interface.

## Example
To test the tool, look at `/example` dir and run

```shell script
npm run generate-test-model
```

## Caveats

- not all possible schema definitions have been implemented or tested
- very unefficient code
- would be nice to not rely on `typeName` for external references
- requires to have all schemas in a single file

## TODO

- unit tests
- add comments based on min / max, etc.
- improve imports (very slow)
- somehow manage to add `SimpleSchema.extendOptions(['typeName']);` automatically?
