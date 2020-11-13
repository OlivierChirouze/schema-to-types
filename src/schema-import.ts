import {
  OptionalKind,
  Project,
  PropertySignatureStructure,
  SourceFile,
  StructureKind
} from "ts-morph";
import SimpleSchema, { SchemaDefinition } from "simpl-schema";
import { SchemaMap } from "./schema-map";

export class SchemaImport {
  private schemas: SchemaMap;

  constructor(private tsConfigFilePath: string) {}

  generateModel(outputFilePath: string) {
    const project = new Project({
      tsConfigFilePath: this.tsConfigFilePath
    });

    const schemaFile = this.getSchemasFile(project);

    if (!schemaFile) {
      throw new Error("File not found!");
    }

    // TODO safer
    const importPath = schemaFile
      .getEmitOutput()
      .getOutputFiles()[0]
      .getFilePath();

    import(importPath).then(importedModule => {
      this.schemas = importedModule["schemas"];
      const sourceFile = project.createSourceFile(outputFilePath, "", {
        overwrite: true
      });

      // TODO add comment "is generated file"

      for (let typeName in this.schemas) {
        const schema = this.schemas[typeName];
        const classDeclaration = sourceFile.addInterface({
          name: typeName
        });

        classDeclaration.setIsExported(true);

        const keys = schema.objectKeys("");
        keys.forEach((key, i) => {
          //valid.optional;

          const declaration = this.getDeclaration(key, schema);
          if (declaration) {
            classDeclaration.addProperty(declaration);
          } else {
            // classDeclaration.
          }
        });
      }

      sourceFile.formatText();
      sourceFile.save();

      console.log(`File saved: ${sourceFile.getFilePath()}`);
    });
  }

  private getSchemasFile(project: Project): SourceFile | undefined {
    return project.getSourceFile(file => {
      const statements = file.getStructure().statements as any[];
      for (let i = 0; i < statements.length; i++) {
        let statement = statements[i];
        if (
          statement.kind === StructureKind.VariableStatement &&
          statement.isExported &&
          statement.declarations &&
          statement.declarations.length === 1 &&
          statement.declarations[0].type === "SchemaMap"
        ) {
          const declaration = statement.declarations[0];
          console.log(`Found variable! ${declaration.name}`);
          return true;
        }
      }
      return false;
    });
  }

  private getDeclaration(
    name: string,
    schema: SimpleSchema
  ): OptionalKind<PropertySignatureStructure> | undefined {
    const valid = schema.getDefinition(name) as SchemaDefinition;

    const rawType = valid.type[0].type;

    const type = this.getType(rawType, name, schema);

    if (type === undefined) {
      console.error(`No proper type found for ${name}`);
      return undefined;
    }

    let declaration: OptionalKind<PropertySignatureStructure> = {
      name: name,
      type,
      hasQuestionToken:
        valid.optional === true ||
        (valid.optional !== false && valid.optional())
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
    rawType,
    name: string,
    schema: SimpleSchema
  ): string | undefined {
    if (rawType == Date) {
      return "Date";
    }
    if (rawType == String) {
      return "string";
    }
    if (rawType == Boolean) {
      return "boolean";
    }
    if (rawType == Number) {
      return "number";
    }
    if (rawType == Array) {
      const subDeclaration = this.getDeclaration(`${name}.$`, schema);
      return `${subDeclaration.type}[]`;
    }

    // TODO support multiple rules with | types
    // TODO support exp

    // This must be related to another schema
    return this.getTypeName(rawType);
  }

  private getTypeName(simpleSchema: SimpleSchema): string | undefined {
    for (let typeName in this.schemas) {
      const schema = this.schemas[typeName];
      if (simpleSchema === schema) {
        return typeName;
      }
    }
    return undefined;
  }
}
