import * as vscode from 'vscode'
import { DiagnosticPort } from '~/application/port/diagnostic-port'
import { LintViolation, LintSeverity } from '~/domain/lint-rule'

/**
 * VS Code implementation of DiagnosticPort
 */
export class VsCodeDiagnosticAdapter implements DiagnosticPort {
  private diagnosticCollection: vscode.DiagnosticCollection

  constructor(name: string = 'rails-openapi-gen') {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection(name)
  }

  setDiagnostics(documentUri: string, violations: LintViolation[]): void {
    const uri = vscode.Uri.parse(documentUri)
    const diagnostics: vscode.Diagnostic[] = violations.map(violation =>
      this.convertToDiagnostic(violation)
    )

    this.diagnosticCollection.set(uri, diagnostics)
  }

  clearDiagnostics(documentUri: string): void {
    const uri = vscode.Uri.parse(documentUri)
    this.diagnosticCollection.delete(uri)
  }

  dispose(): void {
    this.diagnosticCollection.dispose()
  }

  private convertToDiagnostic(violation: LintViolation): vscode.Diagnostic {
    const range = new vscode.Range(
      violation.line,
      violation.column,
      violation.line,
      violation.column + 20 // Approximate length
    )

    const diagnostic = new vscode.Diagnostic(
      range,
      violation.message,
      this.convertSeverity(violation.severity)
    )

    diagnostic.source = 'rails-openapi-gen'
    diagnostic.code = violation.rule

    return diagnostic
  }

  private convertSeverity(severity: LintSeverity): vscode.DiagnosticSeverity {
    switch (severity) {
      case LintSeverity.ERROR:
        return vscode.DiagnosticSeverity.Error
      case LintSeverity.WARNING:
        return vscode.DiagnosticSeverity.Warning
      case LintSeverity.INFO:
        return vscode.DiagnosticSeverity.Information
      default:
        return vscode.DiagnosticSeverity.Information
    }
  }
}
