import { MyEnum } from "./model";

export interface SubType {
    aNumber: number;
}

export interface Foo {
    aSpecificField: SubType;
    anArrayOfBooleans: boolean[];
    aDate?: Date;
    aString: string;
    anEnum?: "a" | "b" | "c";
    anEnumWithType: MyEnum;
}
