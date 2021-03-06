import { SchemaMap } from '../src/schema-map';
import { Id, MyEnum } from './models/model';
import SimpleSchema from 'simpl-schema';

export const schemas: SchemaMap = {};

// Essential to be allowed to use typeName property and reference types explicitly
SimpleSchema.extendOptions(['typeName']);

schemas['SubType'] = new SimpleSchema({
    aNumber: {
        type: Number,
        min: 12, // Ignored for the moment
        max: 14.5
    }
});

schemas['Foo'] = new SimpleSchema({
    aSubObject: schemas['SubType'],
    anArrayOfBooleans: {
        type: Array
    },
    'anArrayOfBooleans.$': {
        type: Boolean
    },
    anArrayOfObjects: {
        type: Array
    },
    'anArrayOfObjects.$': {
        type: Object
    },
    'anArrayOfObjects.$.arrString': {
        type: String,
        optional: true
    },
    'anArrayOfObjects.$.arrInteger': {
        type: SimpleSchema.Integer,
        optional: false
    },
    aDate: {
        type: Date,
        optional: true,
        autoValue: () => new Date() // Ignored for the moment
    },
    aString: {
        type: String,
        defaultValue: 'schemas' // Ignored for the moment
    },
    aTypedString: {
        type: String as (value?: any) => Id, // To make sure Id is imported
        // @ts-ignore
        typeName: 'Id'
    },
    anEnum: {
        type: MyEnum, // Will generate the list of possible values
        optional: true
    },
    anEnumWithType: {
        type: MyEnum,
        // @ts-ignore
        typeName: 'MyEnum' // Will reference MyEnum type directly
    },
    // @ts-ignore
    aPropertyWithTwoAlternatives: SimpleSchema.oneOf(
        // @ts-ignore
        new SimpleSchema({
            name: {
                type: String
            },
            value: {
                type: Number,
                optional: true
            }
        }),
        new SimpleSchema({
            date: {
                type: Date
            }
        })
    )
});
