import { Id, MyEnum } from './model';

// *************************************************************
//                Generated file: do not edit
// This file was generated by schema-to-types npm library
// More info: https://github.com/OlivierChirouze/schema-to-types
// *************************************************************
export interface SubType {
    aNumber: number;
}

export interface Foo {
    aSubObject: SubType;
    anArrayOfBooleans: boolean[];
    anArrayOfObjects: { arrString?: string; arrInteger: number }[];
    aDate?: Date;
    aString: string;
    aTypedString: Id;
    anEnum?: 'a' | 'b' | 'c';
    anEnumWithType: MyEnum;
    aPropertyWithTwoAlternatives: { name: string; value?: number } | { date: Date };
}
