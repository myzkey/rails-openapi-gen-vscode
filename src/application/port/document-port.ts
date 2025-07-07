import { TextDocument } from '~/application/port/completion-port'

/**
 * Port interface for document operations
 */
export interface DocumentPort {
  /**
   * Get all open text documents
   */
  getAllDocuments(): TextDocument[]

  /**
   * Get a specific document by URI
   * @param uri The document URI
   */
  getDocument(uri: string): TextDocument | undefined

  /**
   * Register a document change listener
   * @param listener The listener function
   * @returns Disposable to unregister the listener
   */
  onDidChangeDocument(listener: (document: TextDocument) => void): Disposable

  /**
   * Register a document open listener
   * @param listener The listener function
   * @returns Disposable to unregister the listener
   */
  onDidOpenDocument(listener: (document: TextDocument) => void): Disposable

  /**
   * Register a document save listener
   * @param listener The listener function
   * @returns Disposable to unregister the listener
   */
  onDidSaveDocument(listener: (document: TextDocument) => void): Disposable
}

/**
 * Disposable resource
 */
export interface Disposable {
  dispose(): void
}
