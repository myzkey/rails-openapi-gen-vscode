import {
  CompletionProvider,
  CompletionItem,
  TextDocument,
  Position,
} from '../application/port/completion-port'
import {
  CompletionUseCase,
  FieldTypeCompletionUseCase,
  AttributeCompletionUseCase,
} from '../application/completion-use-case'

/**
 * Completion provider for @openapi comments
 */
export class OpenApiCompletionProvider implements CompletionProvider {
  private completionUseCase = new CompletionUseCase()

  provideCompletionItems(document: TextDocument, position: Position): CompletionItem[] {
    return this.completionUseCase.getOpenApiCompletions(document, position)
  }
}

/**
 * Completion provider for field types
 */
export class FieldTypeCompletionProvider implements CompletionProvider {
  private fieldTypeUseCase = new FieldTypeCompletionUseCase()

  provideCompletionItems(document: TextDocument, position: Position): CompletionItem[] {
    return this.fieldTypeUseCase.getTypeCompletions(document, position)
  }
}

/**
 * Completion provider for attributes
 */
export class AttributeCompletionProvider implements CompletionProvider {
  private attributeUseCase = new AttributeCompletionUseCase()

  provideCompletionItems(document: TextDocument, position: Position): CompletionItem[] {
    return this.attributeUseCase.getAttributeCompletions(document, position)
  }
}
