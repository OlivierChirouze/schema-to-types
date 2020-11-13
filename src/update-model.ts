#!/usr/bin/env ts-node-script

import { SchemaImport } from "./schema-import";

const myArgs = process.argv.slice(2);

new SchemaImport(myArgs[0]).generateModel(myArgs[1]);
