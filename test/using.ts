import { Foo } from "./model";
import { schemas } from "./schemas";

const myObject: Foo = {
  aSpecificField: {
    aNumber: 12
  },
  aString: "something",
  anArrayOfBooleans: [true, false, true],
  aDate: new Date()
};

schemas["Foo"].validate(myObject);
