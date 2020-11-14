import { Foo } from "./models/generated-model";
import { schemas } from "./schemas";
import { MyEnum } from "./models/model";

const myObject: Foo = {
  aSpecificField: {
    aNumber: 12
  },
  aString: "something",
  anArrayOfBooleans: [true, false, true],
  aDate: new Date(),
  anEnumWithType: MyEnum.VALUE_A
};

schemas["Foo"].validate(myObject);
