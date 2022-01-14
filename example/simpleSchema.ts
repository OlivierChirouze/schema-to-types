import SimpleSchema from 'simpl-schema';

export const defaultMeta = {
    anObjectWithAnArrayOfBooleans: new SimpleSchema({
        property: {
            type: Array
        },
        'property.$': {
            type: Boolean
        }
    })
};
