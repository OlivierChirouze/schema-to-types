import { Foo } from './models/generated-model';
import { schemas } from './test/schemas';
import { MyEnum } from './models/model';

const myObject: Foo = {
    aSubSchemaInternal: { aNumber: 0 },
    anArrayOfObjects: [
        {
            arrInteger: 12
        }
    ],
    aSubSchemaExternal: {
        aNumber: 12
    },
    aString: 'something',
    anArrayOfBooleans: [true, false, true],
    aDate: new Date(),
    anEnumWithType: MyEnum.VALUE_A,
    anEnum: MyEnum.VALUE_B,
    aTypedString: 'an Id',
    aPropertyWithTwoAlternatives: { name: 'the name', value: 14 },
    anObjectWithAnArrayOfBooleans: { property: [true, false, false] }
};

schemas['Foo'].validate(myObject);
