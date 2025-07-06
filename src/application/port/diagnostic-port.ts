import { LintViolation } from '../../domain/lint-rule'

/**
 * Port interface for diagnostic operations
 * This abstraction allows the application layer to report diagnostics
 * without depending on specific IDE implementations
 */
export interface DiagnosticPort {
  /**
   * Set diagnostics for a document
   * @param documentUri The document URI
   * @param violations The lint violations to display
   */
  setDiagnostics(documentUri: string, violations: LintViolation[]): void

  /**
   * Clear all diagnostics for a document
   * @param documentUri The document URI
   */
  clearDiagnostics(documentUri: string): void

  /**
   * Dispose of the diagnostic collection
   */
  dispose(): void
}

/**
 * Diagnostic severity levels
 */
export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}
