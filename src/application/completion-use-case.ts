import { CompletionItem, CompletionItemKind, TextDocument, Position } from './port/completion-port'
import { JBuilderFieldExtractor } from '../domain/jbuilder-field'
import { OpenApiType, isValidOpenApiType } from '../domain/openapi-comment'

/**
 * Use case for providing code completions
 */
export class CompletionUseCase {
  /**
   * Get completion items for @openapi comments
   */
  getOpenApiCompletions(document: TextDocument, position: Position): CompletionItem[] {
    const line = document.getLineAt(position.line)
    const linePrefix = line.substring(0, position.character)

    // If typing after @openapi with space
    if (linePrefix.match(/@openapi\s+$/)) {
      return this.getFieldNameCompletions(document)
    }

    // If typing after field name and colon
    if (linePrefix.match(/@openapi\s+\w+:$/)) {
      return this.getTypeCompletions()
    }

    // If typing after type with space
    if (linePrefix.match(/@openapi\s+\w+:\w+\s+$/)) {
      return this.getAttributeCompletions()
    }

    return []
  }

  /**
   * Get field name completions from the document
   */
  private getFieldNameCompletions(document: TextDocument): CompletionItem[] {
    const documentText = document.getText()
    const fields = JBuilderFieldExtractor.findFieldsRequiringDocumentation(documentText)
    const completions: CompletionItem[] = []

    for (const fieldName of fields) {
      completions.push({
        label: fieldName,
        kind: CompletionItemKind.Field,
        detail: 'JSON field',
        insertText: `${fieldName}:`,
        documentation: `Document the ${fieldName} field`,
      })
    }

    return completions
  }

  /**
   * Get OpenAPI type completions
   */
  private getTypeCompletions(): CompletionItem[] {
    return Object.values(OpenApiType).map(type => ({
      label: type,
      kind: CompletionItemKind.Keyword,
      detail: 'OpenAPI type',
      documentation: `OpenAPI ${type} type`,
    }))
  }

  /**
   * Get attribute completions
   */
  private getAttributeCompletions(): CompletionItem[] {
    return [
      {
        label: 'required:true',
        kind: CompletionItemKind.Property,
        detail: 'Mark field as required',
        documentation: 'Indicates this field is required in the response',
      },
      {
        label: 'required:false',
        kind: CompletionItemKind.Property,
        detail: 'Mark field as optional',
        documentation: 'Indicates this field is optional in the response',
      },
      {
        label: 'description:""',
        kind: CompletionItemKind.Property,
        detail: 'Add field description',
        insertText: 'description:"$1"',
        documentation: 'Provide a description for this field',
      },
      {
        label: 'format:',
        kind: CompletionItemKind.Property,
        detail: 'Specify format',
        documentation: 'Specify the format of the field (e.g., date-time, email)',
      },
      {
        label: 'example:""',
        kind: CompletionItemKind.Property,
        detail: 'Add example value',
        insertText: 'example:"$1"',
        documentation: 'Provide an example value for this field',
      },
    ]
  }
}

/**
 * Use case for providing field type completions
 */
export class FieldTypeCompletionUseCase {
  /**
   * Get type completions when cursor is after a colon
   */
  getTypeCompletions(document: TextDocument, position: Position): CompletionItem[] {
    const line = document.getLineAt(position.line)
    const linePrefix = line.substring(0, position.character)

    // Check if we're in an @openapi comment after a colon
    if (!linePrefix.includes('@openapi') || !linePrefix.endsWith(':')) {
      return []
    }

    return Object.values(OpenApiType).map(type => ({
      label: type,
      kind: CompletionItemKind.Keyword,
      detail: 'OpenAPI type',
      documentation: `OpenAPI ${type} type`,
    }))
  }
}

/**
 * Use case for providing attribute completions
 */
export class AttributeCompletionUseCase {
  /**
   * Get attribute completions after a space
   */
  getAttributeCompletions(document: TextDocument, position: Position): CompletionItem[] {
    const line = document.getLineAt(position.line)
    const linePrefix = line.substring(0, position.character)

    // Check if we're in an @openapi comment with a complete type
    const match = linePrefix.match(/@openapi\s+\w+:(\w+)\s+$/)
    if (!match) {
      return []
    }

    const type = match[1]
    if (!isValidOpenApiType(type)) {
      return []
    }

    // Return attribute completions
    const completions: CompletionItem[] = []

    // Add required attribute if not already present
    if (!line.includes('required:')) {
      completions.push(
        {
          label: 'required:true',
          kind: CompletionItemKind.Property,
          detail: 'Mark as required',
        },
        {
          label: 'required:false',
          kind: CompletionItemKind.Property,
          detail: 'Mark as optional',
        }
      )
    }

    // Add description if not already present
    if (!line.includes('description:')) {
      completions.push({
        label: 'description:""',
        kind: CompletionItemKind.Property,
        detail: 'Add description',
        insertText: 'description:"$1"',
      })
    }

    // Add format for specific types
    if (
      (type === OpenApiType.STRING ||
        type === OpenApiType.INTEGER ||
        type === OpenApiType.NUMBER) &&
      !line.includes('format:')
    ) {
      completions.push({
        label: 'format:',
        kind: CompletionItemKind.Property,
        detail: 'Specify format',
      })
    }

    // Add example if not already present
    if (!line.includes('example:')) {
      completions.push({
        label: 'example:""',
        kind: CompletionItemKind.Property,
        detail: 'Add example',
        insertText: 'example:"$1"',
      })
    }

    return completions
  }
}
