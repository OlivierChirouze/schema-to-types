import {
    CodeBlockWriter,
    ImportDeclarationStructure,
    OptionalKind,
    Project,
    PropertySignatureStructure,
    SourceFile,
    StructureKind
} from 'ts-morph';
import SimpleSchema, { SchemaDefinition } from 'simpl-schema';
import { SchemaMap } from './schema-map';
import { from } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as path from 'path';
import * as fs from 'fs';

class TypeNotFoundError extends Error {
    constructor(type: string) {
        super(`Type not found: ${type}`);
    }
}

// Type name might have been defined explicitly
type ExtendedSchemaDefinition = SchemaDefinition & { typeName?: string };

export class SchemaImport {
    private schemas: SchemaMap;

    constructor(private readonly tmpDir: string, private tsConfigFilePath: string) {
    }

    generateModel(outputFilePath: string) {
        const project = new Project({
            tsConfigFilePath: this.tsConfigFilePath
        });

        const mapNameAndFile = this.getSchemaMapNameAndFile(project);

        if (!mapNameAndFile) {
            throw new Error(
                '--------------------------------------\n' +
                'File containing a SchemaMap export: not found\n' +
                '---------------------------------------------'
            );
        }

        const outputFile = project.createSourceFile(outputFilePath, '', {
            overwrite: true
        });

        outputFile.addStatements((writer: CodeBlockWriter) => {
            writer.writeLine('// *************************************************************');
            writer.writeLine('//                Generated file: do not edit');
            writer.writeLine('// This file was generated by schema-to-types npm library');
            writer.writeLine('// More info: https://github.com/OlivierChirouze/schema-to-types');
            writer.writeLine('// *************************************************************');
            writer.blankLine();
        });

        const mainImportPath = this.getImportPath(mapNameAndFile.source.getFilePath());

        // Import all the imports that exist in the original file, not related to simpl-schema
        const imports: (OptionalKind<ImportDeclarationStructure> & {
            source: SourceFile;
        })[] = mapNameAndFile.source
            .getImportDeclarations()
            .map((d) => {

                let moduleSpecifier: string;

                if (d.isModuleSpecifierRelative()) {
                    // Try to build the path "manually"
                    let importPath = path.resolve(
                        `${mapNameAndFile.source.getDirectoryPath()}/${d.getModuleSpecifierValue()}`
                    );

                    let fileFound = undefined;
                    if (fs.existsSync(`${importPath}`)) {
                        fileFound = importPath;
                    } else if (fs.existsSync(`${importPath}.ts`)) {
                        fileFound = `${importPath}.ts`;
                    } else if (fs.existsSync(`${importPath}.d.ts`)) {
                        fileFound = `${importPath}.d.ts`;
                    } else if (fs.existsSync(`${importPath}.js`)) {
                        fileFound = `${importPath}.js`;
                    }

                    // Try .ts, .d.ts, .js files
                    if (fileFound) {
                        moduleSpecifier = `./${path.relative(outputFile.getDirectoryPath(), importPath)}`;

                    } else {
                        moduleSpecifier = outputFile.getRelativePathTo(d.getModuleSpecifierSourceFile())
                            // TS2691: An import path cannot end with a '.ts' extension.
                            .replace(/\.ts$/, '');
                    }

                } else {
                    // Node module: leave as-is
                    moduleSpecifier = d.getModuleSpecifierValue();
                }

                return {
                    namedImports: d
                        .getNamedImports()
                        .map((i) => i.getName())
                        .filter((s) => s !== 'SchemaMap'),
                    moduleSpecifier,
                    source: d.getModuleSpecifierSourceFile()
                };
            })
            .filter((i) => i.namedImports.length > 0);

        outputFile.addImportDeclarations(imports);

        const importSchemas = from(import(mainImportPath));
        importSchemas
            .pipe(
                tap((importedModule) => {
                    this.schemas = importedModule[mapNameAndFile.name];

                    for (let typeName in this.schemas) {
                        const schema = this.schemas[typeName];
                        const classDeclaration = outputFile.addInterface({
                            name: typeName
                        });

                        mapNameAndFile.source.getStructure();

                        classDeclaration.setIsExported(true);

                        const keys = schema.objectKeys('');
                        keys.forEach((key, i) => {
                            const declaration = this.getDeclaration(key, schema);
                            classDeclaration.addProperty(declaration);
                        });
                    }

                    outputFile.organizeImports();

                    outputFile.formatText();
                    outputFile.save();

                    console.log(`File saved: ${outputFile.getFilePath()}`);
                })
            )
            .subscribe(
                () => {
                },
                (error) => {
                    if (error.message && error.message.endsWith('"typeName" is not a supported property')) {
                        console.error(
                            '---------------------------------------------------------------------------------------------\n' +
                            'It seems you are using typeName property but didn\'t allow it. Make sure your schema file contains:\n' +
                            'SimpleSchema.extendOptions([\'typeName\']);\n' +
                            '--------------------------------------------------------------------------------------------------\n'
                        );
                    } else {
                        throw error;
                    }
                }
            );

        //const otherImports = imports.map(i => from(import(i.source.getFilePath())));
    }

    private getSchemaMapNameAndFile(project: Project): { name: string; source: SourceFile } | undefined {
        const files = project.getSourceFiles();
        for (let iFile = 0; iFile < files.length; iFile++) {
            let file = files[iFile];
            const statements = file.getStructure().statements as any[];
            for (let iStatement = 0; iStatement < statements.length; iStatement++) {
                let statement = statements[iStatement];
                if (
                    statement.kind === StructureKind.VariableStatement &&
                    statement.isExported &&
                    statement.declarations &&
                    statement.declarations.length > 0
                ) {
                    const schemaMap = statement.declarations.filter((declaration) => declaration.type === 'SchemaMap');
                    if (schemaMap.length === 1) {
                        return {
                            name: schemaMap[0].name,
                            source: file
                        };
                    }
                }
            }
        }
        return undefined;
    }

    private getDeclaration(name: string, schema: SimpleSchema): OptionalKind<PropertySignatureStructure> | undefined {
        const schemaDefinition = schema.getDefinition(name) as ExtendedSchemaDefinition;

        return this.getDeclarationFromDefinition(schemaDefinition, name, schema);
    }

    private getDeclarationFromDefinition(schemaDefinition: SchemaDefinition & { typeName?: string }, name: string, schema: SimpleSchema) {
        const type = this.getType(schemaDefinition, name, schema);

        let declaration: OptionalKind<PropertySignatureStructure> = {
            name: name,
            type,
            hasQuestionToken:
                schemaDefinition.optional === true ||
                (schemaDefinition.optional !== false && schemaDefinition.optional())
        };

        // TODO use label for comment
        // TODO use min max values for comment
        // TODO support inheritance of schemas
        // TODO use allowedValues to generate enum?

        return declaration;
    }

    private joinDefinifions(rawType: any[]) {
        return rawType.map((type) => {
            const subDeclarations = type.objectKeys('').map((subKey) => {
                const declaration = this.getDeclaration(subKey, type);
                return `${subKey}${declaration.hasQuestionToken ? '?' : ''}: ${declaration.type}`;
            });

            return `{${subDeclarations.join(',')}}`;
        }).join('|');
    }

    private getType(
        schemaDefinition: ExtendedSchemaDefinition,
        name: string,
        schema: SimpleSchema
    ): string | undefined {
        if (schemaDefinition.typeName) {
            return schemaDefinition.typeName;
        }

        const rawTypes = this.getRawType(schemaDefinition);
        if (rawTypes.length > 1) {
            return this.joinDefinifions(rawTypes);
        }

        const rawType = rawTypes[0];

        if (rawType === Date) {
            return 'Date';
        }
        if (rawType === String) {
            return 'string';
        }
        if (rawType === Boolean) {
            return 'boolean';
        }
        if (rawType === Number || rawType == SimpleSchema.Integer) {
            return 'number';
        }
        if (rawType === Object) {
            const prefix = `${name}`;
            const subKeys = schema.objectKeys(prefix);

            // Sub model is detailed
            if (subKeys.length > 0) {
                const subDeclarations = subKeys.map((subKey) => {
                    const declaration = this.getDeclaration(`${prefix}.${subKey}`, schema);
                    return `${subKey}${declaration.hasQuestionToken ? '?' : ''}: ${declaration.type}`;
                });

                return `{${subDeclarations.join(',')}}`;
            }

            // Sub model is not detailed
            return 'Object';
        }

        if (rawType === Array) {
            const prefix = `${name}.$`;
            const elementSchemaDefinition = schema.getDefinition(prefix) as ExtendedSchemaDefinition;
            const elementRawType = this.getRawType(elementSchemaDefinition);
            // Try if the array element is a reference to another definition
            const types = elementRawType.map(subType => {
                try {
                    const typeName = this.findReferencedDefinition(subType);
                    return `${typeName}`;
                } catch (e) {
                    if (e instanceof TypeNotFoundError) {
                        if (typeof subType === 'string') {
                            return `(${subType})`;
                        }

                        const subKeys = subType.objectKeys ? subType.objectKeys('') : schema.objectKeys(prefix);

                        // Sub model is detailed
                        if (subKeys.length > 0) {
                            const subDeclarations = subKeys.map((subKey) => {
                                const declaration = this.getDeclaration(`${prefix}.${subKey}`, schema);
                                return `${subKey}${declaration.hasQuestionToken ? '?' : ''}: ${declaration.type}`;
                            });

                            return `{${subDeclarations.join(',')}}`;
                        }

                        // Sub model is not detailed
                        const subDeclaration = this.getDeclaration(prefix, schema);
                        return `${subDeclaration.type}`;
                    }
                    throw e;
                }
            }).join('|');

            return elementRawType.length > 1 ? `(${types})[]` : `${types}[]`;
        }

        // TODO support Regexp

        // This is probably related to another schema in the map
        try {
            return this.findReferencedDefinition(rawType);
        } catch (e) {
            if (e instanceof TypeNotFoundError) {
                if (rawType.getDefinition) {
                    // This is a SimpleSchema
                    const definition = rawType.getDefinition();
                    const subKeys = Object.keys(definition);

                    if (subKeys.length > 0) {
                        const subDeclarations = subKeys
                            .filter((subKey) => !subKey.includes('$'))
                            .map((subKey) => {
                                const declaration = this.getDeclarationFromDefinition(definition[subKey], subKey, rawType);
                                return `${subKey}${declaration.hasQuestionToken ? '?' : ''}: ${declaration.type}`;
                            });

                        return `{${subDeclarations.join(',')}}`;
                    }

                    return 'Object';
                }

                // Let's say it's an enum
                return Object.values(rawType)
                    .map((v) => {
                        // If it's an enum then the value is a scalar
                        if (typeof v === 'object') {
                            throw e;
                        }
                        return JSON.stringify(v);
                    })
                    .join(' | ');
            }
            throw e;
        }
    }

    private getRawType(schemaDefinition: SchemaDefinition & { typeName?: string }): any[] {
        if (schemaDefinition.type.length > 1) {
            // OneOf() (multiple alternatives)
            return schemaDefinition.type
                .map((type) => type.type);
        }

        let rawType =
            schemaDefinition.type.length && schemaDefinition.type.length === 1
                ? schemaDefinition.type[0].type
                : schemaDefinition.type;

        // In case it's a SimpleSchemaGroup
        if (rawType.definitions) {
            rawType = rawType.definitions[0].type;
        }
        return [rawType];
    }

    private findReferencedDefinition(typeDefinition: Object): string | undefined {
        for (let typeName in this.schemas) {
            const schema = this.schemas[typeName];
            if (typeDefinition === schema) {
                return typeName;
            }
        }

        throw new TypeNotFoundError(JSON.stringify(typeDefinition));
    }

    private getImportPath(filePath: string): string {
        // TODO Very unefficient, but works
        const project = new Project({
            compilerOptions: {
                outDir: this.tmpDir,
                allowJs: true
            }
        });

        const copyFile = project.addSourceFileAtPath(filePath);
        project.emitSync();

        return copyFile.getEmitOutput().getOutputFiles()[0].getFilePath();
    }
}
