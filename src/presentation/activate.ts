import * as vscode from 'vscode'

// Use Cases
import { LintUseCase } from '~/application/lint-use-case'
import { GenerateUseCase } from '~/application/generate-use-case'
import { CheckUseCase } from '~/application/check-use-case'

// Adapters
import { VsCodeTerminalAdapter } from '~/infrastructure/vscode-adapter/vscode-terminal-adapter'
import { VsCodeDiagnosticAdapter } from '~/infrastructure/vscode-adapter/vscode-diagnostic-adapter'
import { VsCodeDocumentAdapter } from '~/infrastructure/vscode-adapter/vscode-document-adapter'
import { VsCodeCompletionAdapter } from '~/infrastructure/vscode-adapter/vscode-completion-adapter'
import { VsCodeHoverAdapter } from '~/infrastructure/vscode-adapter/vscode-hover-adapter'
import { VsCodeConfigurationAdapter } from '~/infrastructure/vscode-adapter/vscode-configuration-adapter'

// Providers
import {
  OpenApiCompletionProvider,
  FieldTypeCompletionProvider,
  AttributeCompletionProvider,
} from './completion-providers'
import { OpenApiHoverProvider } from './hover-provider'

/**
 * Extension activation point with dependency injection
 */
export function activate(context: vscode.ExtensionContext) {
  // Initialize adapters
  const terminalAdapter = new VsCodeTerminalAdapter()
  const diagnosticAdapter = new VsCodeDiagnosticAdapter()
  const documentAdapter = new VsCodeDocumentAdapter()
  const completionAdapter = new VsCodeCompletionAdapter()
  const hoverAdapter = new VsCodeHoverAdapter()
  const configAdapter = new VsCodeConfigurationAdapter()

  // Initialize use cases with dependencies
  const lintUseCase = new LintUseCase(diagnosticAdapter)
  const generateUseCase = new GenerateUseCase(terminalAdapter)
  const checkUseCase = new CheckUseCase(terminalAdapter)

  // Register commands
  registerCommands(context, generateUseCase, checkUseCase, lintUseCase, documentAdapter)

  // Register providers
  registerProviders(context, completionAdapter, hoverAdapter)

  // Setup event listeners
  setupEventListeners(context, lintUseCase, documentAdapter, configAdapter)

  // Initial lint of all open documents
  documentAdapter.getAllDocuments().forEach(doc => {
    if (shouldLintDocument(doc.uri, doc.languageId)) {
      lintUseCase.execute(doc)
    }
  })

  // Cleanup on deactivation
  context.subscriptions.push(diagnosticAdapter)
  context.subscriptions.push(terminalAdapter)
}

/**
 * Register extension commands
 */
function registerCommands(
  context: vscode.ExtensionContext,
  generateUseCase: GenerateUseCase,
  checkUseCase: CheckUseCase,
  lintUseCase: LintUseCase,
  documentAdapter: VsCodeDocumentAdapter
) {
  // Generate command
  const generateCommand = vscode.commands.registerCommand('railsOpenapiGen.generate', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    try {
      await generateUseCase.execute(workspaceFolder)
      vscode.window.showInformationMessage('OpenAPI generation started')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      vscode.window.showErrorMessage(`Failed to generate OpenAPI: ${errorMessage}`)
    }
  })

  // Check command
  const checkCommand = vscode.commands.registerCommand('railsOpenapiGen.check', async () => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    try {
      await checkUseCase.execute(workspaceFolder)
      vscode.window.showInformationMessage('OpenAPI check started')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      vscode.window.showErrorMessage(`Failed to check OpenAPI: ${errorMessage}`)
    }
  })

  // Lint command
  const lintCommand = vscode.commands.registerCommand('railsOpenapiGen.lint', () => {
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      const document = documentAdapter.getDocument(activeEditor.document.uri.toString())
      if (document) {
        lintUseCase.execute(document)
        vscode.window.showInformationMessage('Linting completed')
      }
    }
  })

  context.subscriptions.push(generateCommand, checkCommand, lintCommand)
}

/**
 * Register completion and hover providers
 */
function registerProviders(
  context: vscode.ExtensionContext,
  completionAdapter: VsCodeCompletionAdapter,
  hoverAdapter: VsCodeHoverAdapter
) {
  const documentSelector = ['ruby', 'erb']

  // OpenAPI completion provider
  const openApiProvider = new OpenApiCompletionProvider()
  const openApiCompletion = completionAdapter.registerCompletionProvider(
    openApiProvider,
    documentSelector,
    [' ', '@']
  )

  // Field type completion provider
  const fieldTypeProvider = new FieldTypeCompletionProvider()
  const fieldTypeCompletion = completionAdapter.registerCompletionProvider(
    fieldTypeProvider,
    documentSelector,
    [':']
  )

  // Attribute completion provider
  const attributeProvider = new AttributeCompletionProvider()
  const attributeCompletion = completionAdapter.registerCompletionProvider(
    attributeProvider,
    documentSelector,
    [' ']
  )

  // Hover provider
  const hoverProvider = new OpenApiHoverProvider()
  const hover = hoverAdapter.registerHoverProvider(hoverProvider, documentSelector)

  context.subscriptions.push(openApiCompletion, fieldTypeCompletion, attributeCompletion, hover)
}

/**
 * Setup event listeners for document changes
 */
function setupEventListeners(
  context: vscode.ExtensionContext,
  lintUseCase: LintUseCase,
  documentAdapter: VsCodeDocumentAdapter,
  configAdapter: VsCodeConfigurationAdapter
) {
  // Lint on save
  const onSave = documentAdapter.onDidSaveDocument(document => {
    if (
      configAdapter.get('lintOnSave', true) &&
      shouldLintDocument(document.uri, document.languageId)
    ) {
      lintUseCase.execute(document)

      // Auto-generate if configured
      if (configAdapter.get('generateOnSave', false)) {
        vscode.commands.executeCommand('railsOpenapiGen.generate')
      }
    }
  })

  // Lint on change
  let changeTimeout: NodeJS.Timeout | undefined
  const onChange = documentAdapter.onDidChangeDocument(document => {
    if (
      configAdapter.get('lintOnChange', true) &&
      shouldLintDocument(document.uri, document.languageId)
    ) {
      // Debounce changes
      if (changeTimeout) {
        clearTimeout(changeTimeout)
      }
      changeTimeout = setTimeout(() => {
        lintUseCase.execute(document)
      }, 500)
    }
  })

  // Lint on open
  const onOpen = documentAdapter.onDidOpenDocument(document => {
    if (shouldLintDocument(document.uri, document.languageId)) {
      lintUseCase.execute(document)
    }
  })

  context.subscriptions.push(onSave, onChange, onOpen)
}

/**
 * Check if a document should be linted
 */
function shouldLintDocument(uri: string, languageId: string): boolean {
  const supportedLanguages = ['ruby', 'erb']
  return supportedLanguages.includes(languageId) || uri.endsWith('.jbuilder')
}

/**
 * Extension deactivation
 */
export function deactivate() {
  // eslint-disable-next-line no-console
  console.log('rails-openapi-gen extension is now deactivated')
}
