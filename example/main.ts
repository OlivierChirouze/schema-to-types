import { Foo, FromJS } from './models/generated-model';
import { schemas } from './schemas';
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
    anArrayWithTwoAlternatives: [
        { name: 'the name', value: 14 },
        { date: new Date('2023-02-09T15:30:57.784Z') }
    ],
    anObjectWithAnArrayOfBooleans: { property: [true, false, false] }
};

schemas['Foo'].validate(myObject);

const myJSObject: FromJS = {
    aJavascriptNumber: 6,
    otherField: 3
};
