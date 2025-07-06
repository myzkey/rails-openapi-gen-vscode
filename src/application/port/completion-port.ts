/**
 * Port interface for code completion operations
 */
export interface CompletionPort {
  /**
   * Register a completion provider
   * @param provider The completion provider implementation
   * @param selector Document selector (e.g., language ids)
   * @param triggerCharacters Characters that trigger completion
   */
  registerCompletionProvider(
    provider: CompletionProvider,
    selector: string[],
    triggerCharacters?: string[]
  ): Disposable
}

/**
 * Completion provider interface
 */
export interface CompletionProvider {
  /**
   * Provide completion items
   * @param document The document
   * @param position The position in the document
   * @returns Array of completion items
   */
  provideCompletionItems(
    document: TextDocument,
    position: Position
  ): CompletionItem[] | Promise<CompletionItem[]>
}

/**
 * Represents a completion item
 */
export interface CompletionItem {
  label: string
  kind?: CompletionItemKind
  detail?: string
  documentation?: string
  insertText?: string
  sortText?: string
}

/**
 * Completion item kinds
 */
export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
}

/**
 * Text document abstraction
 */
export interface TextDocument {
  uri: string
  languageId: string
  version: number
  getText(): string
  getLineAt(line: number): string
  getLineCount(): number
}

/**
 * Position in a text document
 */
export interface Position {
  line: number
  character: number
}

/**
 * Disposable resource
 */
export interface Disposable {
  dispose(): void
}
