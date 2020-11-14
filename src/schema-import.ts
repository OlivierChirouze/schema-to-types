import {
  ImportDeclarationStructure,
  OptionalKind,
  Project,
  PropertySignatureStructure,
  SourceFile,
  StructureKind
} from "ts-morph";
import SimpleSchema, { SchemaDefinition } from "simpl-schema";
import { SchemaMap } from "./schema-map";
import { from } from "rxjs";
import { tap } from "rxjs/operators";

class TypeNotFoundError extends Error {
  constructor(public typeName: string) {
    super();
  }
}

// Type name might have been defined explicitly
type ExtendedSchemaDefinition = SchemaDefinition & { typeName?: string };

export class SchemaImport {
  private static readonly _tmpDir = "./.tmp";
  private schemas: SchemaMap;

  constructor(private tsConfigFilePath: string) {}

  generateModel(outputFilePath: string) {
    const project = new Project({
      tsConfigFilePath: this.tsConfigFilePath
    });

    const mapNameAndFile = this.getSchemaMapNameAndFile(project);

    if (!mapNameAndFile) {
      throw new Error("File not found!");
    }

    const outputFile = project.createSourceFile(outputFilePath, "", {
      overwrite: true
    });

    // Import all the imports that exist in the original file, not related to simpl-schema
    const imports: (OptionalKind<ImportDeclarationStructure> & {
      source: SourceFile;
    })[] = mapNameAndFile.source
      .getImportDeclarations()
      .map(d => ({
        namedImports: d
          .getNamedImports()
          .map(i => i.getName())
          .filter(s => s !== "SchemaMap"),
        moduleSpecifier:
          "./" +
          outputFile
            .getRelativePathTo(d.getModuleSpecifierSourceFile())
            // TS2691: An import path cannot end with a '.ts' extension.
            .replace(/\.ts$/, ""),
        source: d.getModuleSpecifierSourceFile()
      }))
      .filter(i => i.namedImports.length > 0);

    outputFile.addImportDeclarations(imports);

    const importPath = this.getImportPath(mapNameAndFile.source);

    const importSchemas = from(import(importPath));
    //const otherImports = imports.map(i => from(import(i.source.getFilePath())));

    importSchemas
      .pipe(
        tap(importedModule => {
          this.schemas = importedModule[mapNameAndFile.name];

          // TODO add comment "is a generated file"
          for (let typeName in this.schemas) {
            const schema = this.schemas[typeName];
            const classDeclaration = outputFile.addInterface({
              name: typeName
            });

            mapNameAndFile.source.getStructure();

            classDeclaration.setIsExported(true);

            const keys = schema.objectKeys("");
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
      .subscribe();
  }

  private getSchemaMapNameAndFile(
    project: Project
  ): { name: string; source: SourceFile } | undefined {
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
          const schemaMap = statement.declarations.filter(
            declaration => declaration.type === "SchemaMap"
          );
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

  private getDeclaration(
    name: string,
    schema: SimpleSchema
  ): OptionalKind<PropertySignatureStructure> | undefined {
    const schemaDefinition = schema.getDefinition(
      name
    ) as ExtendedSchemaDefinition;

    const type = this.getType(schemaDefinition, name, schema);

    let declaration: OptionalKind<PropertySignatureStructure> = {
      name: name,
      type,
      hasQuestionToken:
        schemaDefinition.optional === true ||
        (schemaDefinition.optional !== false && schemaDefinition.optional())
    };

    // TODO use min max values for comments
    // TODO support inheritance

    // TODO default values don't make sense for interfaces. Should use a class instead?
    /*
    if (valid.defaultValue !== undefined) {
      declaration.initializer = JSON.stringify(valid.defaultValue);
    }
     */

    return declaration;
  }

  private getType(
    schemaDefinition: ExtendedSchemaDefinition,
    name: string,
    schema: SimpleSchema
  ): string | undefined {
    const rawType = schemaDefinition.type[0].type;

    if (schemaDefinition.typeName) {
      return schemaDefinition.typeName;
    }

    if (rawType == Date) {
      return "Date";
    }
    if (rawType == String) {
      return "string";
    }
    if (rawType == Boolean) {
      return "boolean";
    }
    if (rawType == Number || rawType == SimpleSchema.Integer) {
      return "number";
    }
    if (rawType == Array) {
      const subDeclaration = this.getDeclaration(`${name}.$`, schema);
      return `${subDeclaration.type}[]`;
    }

    // TODO support enums
    // TODO support multiple rules SimpleSchema.oneOf()
    // TODO support Regexp

    // This is probably related to another schema

    try {
      return this.getTypeName(name, rawType);
    } catch (e) {
      if (e instanceof TypeNotFoundError) {
        // Let's say it's an enum
        return Object.values(rawType)
          .map(v => JSON.stringify(v))
          .join(" | ");
        /*
        console.error(
          `Type not found - setting property to Any: ${name}.${e.typeName}`
        );
        // FIXME add a comment
        return "any";
         */
      } else {
        throw e;
      }
    }
  }

  private getTypeName(
    name: string,
    typeDefinition: Object
  ): string | undefined {
    for (let typeName in this.schemas) {
      const schema = this.schemas[typeName];
      if (typeDefinition === schema) {
        return typeName;
      }
    }

    // FIXME if enum, get values as possible values
    throw new TypeNotFoundError(name);
  }

  // TODO also return the dependencies that are not schema related so that they can be imported
  // TODO format: name of the import => module. So that all can be imported
  private getImportPath(schemaFile: SourceFile): string {
    // TODO Very unefficient, but works
    const project = new Project({
      compilerOptions: { outDir: SchemaImport._tmpDir }
    });

    const copyFile = project.addSourceFileAtPath(schemaFile.getFilePath());
    project.emitSync();

    return copyFile
      .getEmitOutput()
      .getOutputFiles()[0]
      .getFilePath();
  }
}
