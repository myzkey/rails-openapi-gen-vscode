import { DiagnosticPort } from '~/application/port/diagnostic-port'
import { DocumentParser } from '~/domain/document-parser'
import { JBuilderFieldExtractor } from '~/domain/jbuilder-field'
import { LintRuleRunner, LintContext } from '~/domain/lint-rule'
import { TextDocument } from '~/application/port/completion-port'

/**
 * Use case for linting JBuilder documents
 */
export class LintUseCase {
  private ruleRunner = new LintRuleRunner()

  constructor(private diagnosticPort: DiagnosticPort) {}

  /**
   * Lint a document and report diagnostics
   */
  execute(document: TextDocument): void {
    // Only lint Ruby and JBuilder files
    if (!this.shouldLintDocument(document)) {
      this.diagnosticPort.clearDiagnostics(document.uri)
      return
    }

    const documentText = document.getText()

    // Parse document
    const comments = DocumentParser.parseComments(documentText)
    const fields = JBuilderFieldExtractor.extractFields(documentText)
    const lines = documentText.split('\n')

    // Create lint context
    const context: LintContext = {
      documentText,
      comments,
      fields,
      lines,
    }

    // Run lint rules
    const violations = this.ruleRunner.run(context)

    // Report diagnostics
    this.diagnosticPort.setDiagnostics(document.uri, violations)
  }

  /**
   * Clear diagnostics for a document
   */
  clearDiagnostics(documentUri: string): void {
    this.diagnosticPort.clearDiagnostics(documentUri)
  }

  private shouldLintDocument(document: TextDocument): boolean {
    const supportedLanguages = ['ruby', 'erb']
    return supportedLanguages.includes(document.languageId) || document.uri.endsWith('.jbuilder')
  }
}
