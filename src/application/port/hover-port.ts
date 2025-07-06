import { Position, TextDocument } from './completion-port'

export { Position, TextDocument }

/**
 * Port interface for hover operations
 */
export interface HoverPort {
  /**
   * Register a hover provider
   * @param provider The hover provider implementation
   * @param selector Document selector (e.g., language ids)
   */
  registerHoverProvider(provider: HoverProvider, selector: string[]): Disposable
}

/**
 * Hover provider interface
 */
export interface HoverProvider {
  /**
   * Provide hover information
   * @param document The document
   * @param position The position in the document
   * @returns Hover information or undefined
   */
  provideHover(
    document: TextDocument,
    position: Position
  ): Hover | undefined | Promise<Hover | undefined>
}

/**
 * Hover information
 */
export interface Hover {
  contents: string[]
  range?: Range
}

/**
 * Range in a text document
 */
export interface Range {
  start: Position
  end: Position
}

/**
 * Disposable resource
 */
export interface Disposable {
  dispose(): void
}
