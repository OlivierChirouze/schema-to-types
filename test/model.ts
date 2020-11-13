export interface SubType {
  aNumber: number;
}

export interface Foo {
  aSpecificField: SubType;
  anArrayOfBooleans: boolean[];
  aDate?: Date;
  aString: string;
}
