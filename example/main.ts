import { Foo } from "./models/generated-model";
import { schemas } from "./schemas";
import { MyEnum } from "./models/model";

const myObject: Foo = {
  aSubObject: {
    aNumber: 12
  },
  aString: "something",
  anArrayOfBooleans: [true, false, true],
  aDate: new Date(),
  anEnumWithType: MyEnum.VALUE_A,
  anEnum: MyEnum.VALUE_B,
  aTypedString: "an Id"
};

schemas["Foo"].validate(myObject);
