import { Foo } from './models/generated-model';
import { schemas } from './schemas';
import { MyEnum } from './models/model';

const myObject: Foo = {
    anArrayOfObjects: [
        {
            arrInteger: 12
        }
    ],
    aSubObject: {
        aNumber: 12
    },
    aString: 'something',
    anArrayOfBooleans: [true, false, true],
    aDate: new Date(),
    anEnumWithType: MyEnum.VALUE_A,
    anEnum: MyEnum.VALUE_B,
    aTypedString: 'an Id',
    aPropertyWithTwoAlternatives: { name: 'the name', value: 14 }
};

schemas['Foo'].validate(myObject);
