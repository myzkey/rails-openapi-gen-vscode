import { vi } from 'vitest'

export interface Uri {
  scheme: string
  authority: string
  path: string
  query: string
  fragment: string
  fsPath: string
  with: (
    change: Partial<{
      scheme: string
      authority: string
      path: string
      query: string
      fragment: string
    }>
  ) => Uri
  toJSON: () => object
}

export interface Disposable {
  dispose(): void
}

export interface Memento {
  get<T>(key: string): T | undefined
  get<T>(key: string, defaultValue: T): T
  update(key: string, value: unknown): Thenable<void>
  keys(): readonly string[]
}

export interface SecretStorage {
  get(key: string): Thenable<string | undefined>
  store(key: string, value: string): Thenable<void>
  delete(key: string): Thenable<void>
  onDidChange: Event<SecretStorageChangeEvent>
}

export interface SecretStorageChangeEvent {
  key: string
}

export interface Event<T> {
  (listener: (e: T) => unknown, thisArgs?: unknown, disposables?: Disposable[]): Disposable
}

export interface EnvironmentVariableMutatorOptions {
  applyAtProcessCreation?: boolean
  applyAtShellIntegration?: boolean
}

export interface EnvironmentVariableMutator {
  readonly type: EnvironmentVariableMutatorType
  readonly value: string
  readonly options: EnvironmentVariableMutatorOptions
}

export enum EnvironmentVariableMutatorType {
  Replace = 1,
  Append = 2,
  Prepend = 3,
}

export interface WorkspaceFolder {
  uri: Uri
  name: string
  index: number
}

export interface EnvironmentVariableScope {
  workspaceFolder?: WorkspaceFolder
}

export interface ScopedEnvironmentVariableCollection {
  persistent: boolean
  description: string
  replace: (variable: string, value: string, options?: EnvironmentVariableMutatorOptions) => void
  append: (variable: string, value: string, options?: EnvironmentVariableMutatorOptions) => void
  prepend: (variable: string, value: string, options?: EnvironmentVariableMutatorOptions) => void
  get: (variable: string) => EnvironmentVariableMutator | undefined
  forEach: (
    callback: (
      variable: string,
      mutator: EnvironmentVariableMutator,
      collection: ScopedEnvironmentVariableCollection
    ) => void
  ) => void
  delete: (variable: string) => void
  clear: () => void
  [Symbol.iterator]: () => Iterator<[variable: string, mutator: EnvironmentVariableMutator]>
}

export interface GlobalEnvironmentVariableCollection extends ScopedEnvironmentVariableCollection {
  getScoped: (scope: EnvironmentVariableScope) => ScopedEnvironmentVariableCollection
}

export interface LanguageModelAccessInformation {
  canSendRequest: (languageModelId: string) => boolean | undefined
  onDidChange: Event<void>
}

export interface Extension<T> {
  id: string
  extensionUri: Uri
  extensionPath: string
  isActive: boolean
  packageJSON: Record<string, unknown>
  exports: T | undefined
  activate(): Thenable<T>
}

export interface ExtensionContext {
  subscriptions: Disposable[]
  extensionUri: Uri
  extensionPath: string
  asAbsolutePath: (relativePath: string) => string
  storagePath?: string
  globalStoragePath: string
  logPath: string
  extensionMode: ExtensionMode
  storageUri: Uri
  globalStorageUri: Uri
  logUri: Uri
  extension: Extension<unknown>
  workspaceState: Memento
  globalState: Memento & { setKeysForSync(keys: readonly string[]): void }
  secrets: SecretStorage
  environmentVariableCollection: GlobalEnvironmentVariableCollection
  languageModelAccessInformation: LanguageModelAccessInformation
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
  workspaceFolders: undefined as WorkspaceFolder[] | undefined,
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
