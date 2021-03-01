#!/usr/bin/env ts-node-script

// Usage: script <tsConfig path> <outputFile path>

import { SchemaImport } from './schema-import';
import * as path from 'path';

const myArgs = process.argv.slice(2);

new SchemaImport(path.join(path.dirname(__dirname), '.tmp'), myArgs[0]).generateModel(myArgs[1]);
