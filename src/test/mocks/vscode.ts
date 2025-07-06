import { vi } from 'vitest'

export interface ExtensionContext {
  subscriptions: any[]
  extensionUri: any
  extensionPath: string
  asAbsolutePath: (path: string) => string
  storagePath?: string
  globalStoragePath: string
  logPath: string
  extensionMode: ExtensionMode
  storageUri: any
  globalStorageUri: any
  logUri: any
  extension: any
  workspaceState: any
  globalState: any
  secrets: any
  environmentVariableCollection: any
}

export enum ExtensionMode {
  Production = 1,
  Development = 2,
  Test = 3,
}

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  activeTextEditor: undefined,
  createTerminal: vi.fn(() => ({
    show: vi.fn(),
    sendText: vi.fn(),
  })),
}

export const workspace = {
  workspaceFolders: undefined as any,
  getConfiguration: vi.fn(() => ({
    get: vi.fn(() => false),
  })),
  onDidSaveTextDocument: vi.fn(),
  onDidChangeTextDocument: vi.fn(),
}

export const commands = {
  registerCommand: vi.fn(),
}

export const languages = {
  createDiagnosticCollection: vi.fn(() => ({
    set: vi.fn(),
    clear: vi.fn(),
    dispose: vi.fn(),
  })),
  registerCompletionItemProvider: vi.fn(),
  registerHoverProvider: vi.fn(),
}

export const TextDocument = vi.fn()
export const Position = vi.fn()
export const Range = vi.fn()
export const Diagnostic = vi.fn()

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3,
}

export const CompletionItem = vi.fn()

export enum CompletionItemKind {
  Field = 4,
  Property = 9,
  Snippet = 14,
  TypeParameter = 24,
  Value = 11,
}

export const SnippetString = vi.fn()
export const MarkdownString = vi.fn()
export const Hover = vi.fn()
export const Uri = {
  file: vi.fn((path: string) => ({ fsPath: path })),
  parse: vi.fn((str: string) => ({ fsPath: str })),
}

export const EventEmitter = vi.fn(() => ({
  event: vi.fn(),
  fire: vi.fn(),
  dispose: vi.fn(),
}))

export default {
  window,
  workspace,
  commands,
  languages,
  TextDocument,
  Position,
  Range,
  Diagnostic,
  DiagnosticSeverity,
  CompletionItem,
  CompletionItemKind,
  SnippetString,
  MarkdownString,
  Hover,
  Uri,
  EventEmitter,
  ExtensionMode,
}