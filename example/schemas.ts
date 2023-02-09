import { SchemaMap } from '../src/schema-map';
import { Id, MyEnum } from './models/model';
import SimpleSchema from 'simpl-schema';
import { Polygon } from 'geojson';
import { definition } from './external-definition';

export const schemas: SchemaMap = {};

// Essential to be allowed to use typeName property and reference types explicitly
SimpleSchema.extendOptions(['typeName']);

schemas['SubType'] = new SimpleSchema({
    aNumber: {
        type: Number,
        min: 12, // Ignored for the moment
        max: 14.5
    },
    aString: {
        type: String,
        optional: true
    }
});

schemas['Foo'] = new SimpleSchema({
    anObjectWithAnArrayOfBooleans: new SimpleSchema({
        property: {
            type: Array
        },
        'property.$': {
            type: Boolean
        }
    }),
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
    // @ts-ignore TODO for some reason the typings from SimpleSchema are incorrect
    aPropertyWithTwoAlternatives: SimpleSchema.oneOf(
        // @ts-ignore TODO for some reason the typings from SimpleSchema are incorrect
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
    ),
    anArrayWithTwoAlternatives: Array,
    // @ts-ignore TODO for some reason the typings from SimpleSchema are incorrect
    'anArrayWithTwoAlternatives.$': SimpleSchema.oneOf(
        // @ts-ignore TODO for some reason the typings from SimpleSchema are incorrect
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
    ),

    aSubSchemaExternal: schemas['SubType'],
    aSubSchemaInternal: new SimpleSchema({
        aNumber: {
            type: Number,
            min: 12, // Ignored for the moment
            max: 14.5
        },
        aString: {
            type: String,
            optional: true
        }
    }),
    anArrayOfExternal: {
        type: Array,
        optional: true
    },
    'anArrayOfExternal.$': schemas['SubType'],
    aPolygon: {
        optional: true,
        type: {
            type: {
                type: String,
                allowedValues: ['Polygon']
            },
            coordinates: { type: Array },
            'coordinates.$': {
                type: Array,
                minCount: 2,
                maxCount: 2
            },
            'coordinates.$.$': { type: Number }
        },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore TODO typings should allow it
        typeName: 'Polygon' as Polygon as unknown as string // Hack to import type
    }
});

schemas['FromJS'] = new SimpleSchema({
    ...definition,
    otherField: Number
});
