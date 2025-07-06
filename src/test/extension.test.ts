import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { activate, deactivate } from '../extension'

function createMockExtensionContext(): vscode.ExtensionContext {
  return {
    subscriptions: [],
    extensionUri: {} as vscode.Uri,
    extensionPath: '/test/path',
    asAbsolutePath: vi.fn().mockImplementation((path: string) => `/test/path/${path}`),
    storagePath: '/test/storage',
    globalStoragePath: '/test/global-storage',
    logPath: '/test/logs',
    extensionMode: vscode.ExtensionMode.Test,
    storageUri: {} as vscode.Uri,
    globalStorageUri: {} as vscode.Uri,
    logUri: {} as vscode.Uri,
    extension: {} as vscode.Extension<unknown>,
    workspaceState: {
      get: vi.fn(),
      update: vi.fn(),
      keys: vi.fn().mockReturnValue([]),
    },
    globalState: {
      get: vi.fn(),
      update: vi.fn(),
      keys: vi.fn().mockReturnValue([]),
      setKeysForSync: vi.fn(),
    },
    secrets: {
      get: vi.fn(),
      store: vi.fn(),
      delete: vi.fn(),
      onDidChange: vi.fn(),
    },
    environmentVariableCollection: {
      persistent: true,
      description: '',
      replace: vi.fn(),
      append: vi.fn(),
      prepend: vi.fn(),
      get: vi.fn(),
      forEach: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      getScoped: vi.fn(),
      [Symbol.iterator]: vi.fn(),
    },
    languageModelAccessInformation: {
      canSendRequest: vi.fn(),
      onDidChange: vi.fn(),
    },
  }
}

// Mock VS Code API
vi.mock('vscode', () => ({
  commands: {
    registerCommand: vi.fn(),
  },
  languages: {
    createDiagnosticCollection: vi.fn(() => ({
      dispose: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    })),
    registerCompletionItemProvider: vi.fn(() => ({ dispose: vi.fn() })),
    registerHoverProvider: vi.fn(() => ({ dispose: vi.fn() })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultValue: unknown) => defaultValue),
    })),
    onDidSaveTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidOpenTextDocument: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeConfiguration: vi.fn(() => ({ dispose: vi.fn() })),
    textDocuments: [],
    workspaceFolders: [],
  },
  window: {
    createTerminal: vi.fn(() => ({
      sendText: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
    })),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
    activeTextEditor: undefined,
  },
  ExtensionMode: {
    Test: 3,
  },
  Uri: {
    parse: vi.fn((str: string) => ({ toString: () => str })),
  },
  Range: vi.fn(),
  Position: vi.fn(),
  Diagnostic: vi.fn(),
  DiagnosticSeverity: {
    Error: 0,
    Warning: 1,
    Information: 2,
    Hint: 3,
  },
  CompletionItem: vi.fn(),
  CompletionItemKind: {
    Text: 0,
    Field: 4,
    Keyword: 13,
    Property: 9,
  },
  SnippetString: vi.fn(),
  MarkdownString: vi.fn(),
  Hover: vi.fn(),
}))

describe('Extension Test Suite', () => {
  let mockContext: vscode.ExtensionContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockExtensionContext()
  })

  describe('activate', () => {
    it('should register all commands', () => {
      activate(mockContext)

      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'railsOpenapiGen.generate',
        expect.any(Function)
      )
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'railsOpenapiGen.check',
        expect.any(Function)
      )
      expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
        'railsOpenapiGen.lint',
        expect.any(Function)
      )
    })

    it('should create diagnostic collection', () => {
      activate(mockContext)

      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith('rails-openapi-gen')
    })

    it('should register completion providers', () => {
      activate(mockContext)

      // Should register 3 completion providers
      expect(vscode.languages.registerCompletionItemProvider).toHaveBeenCalledTimes(3)

      // Check that providers are registered with correct selectors
      const calls = vi.mocked(vscode.languages.registerCompletionItemProvider).mock.calls
      calls.forEach(call => {
        expect(call[0]).toEqual(['ruby', 'erb'])
      })
    })

    it('should register hover provider', () => {
      activate(mockContext)

      expect(vscode.languages.registerHoverProvider).toHaveBeenCalledWith(
        ['ruby', 'erb'],
        expect.any(Object)
      )
    })

    it('should register document event listeners', () => {
      activate(mockContext)

      expect(vscode.workspace.onDidSaveTextDocument).toHaveBeenCalled()
      expect(vscode.workspace.onDidChangeTextDocument).toHaveBeenCalled()
      expect(vscode.workspace.onDidOpenTextDocument).toHaveBeenCalled()
    })

    it('should add disposables to subscriptions', () => {
      activate(mockContext)

      expect(mockContext.subscriptions.length).toBeGreaterThan(0)
    })
  })

  describe('deactivate', () => {
    it('should be defined', () => {
      expect(deactivate).toBeDefined()
    })
  })
})

describe('Command Handlers', () => {
  let mockContext: vscode.ExtensionContext

  beforeEach(() => {
    vi.clearAllMocks()
    mockContext = createMockExtensionContext()

    // Reset terminal mock to default behavior
    const mockTerminal: Partial<vscode.Terminal> = {
      sendText: vi.fn(),
      show: vi.fn(),
      dispose: vi.fn(),
      name: 'Test Terminal',
      processId: Promise.resolve(1234),
      creationOptions: {},
      exitStatus: undefined,
      state: { isInteractedWith: false, shell: '/bin/bash' },
    }
    vi.mocked(vscode.window.createTerminal).mockReturnValue(mockTerminal as vscode.Terminal)
  })

  describe('railsOpenapiGen.generate', () => {
    it('should create terminal and run rails command', async () => {
      const mockWorkspace = vi.mocked(vscode.workspace)
      mockWorkspace.workspaceFolders = [
        { uri: { fsPath: '/test/workspace' } } as vscode.WorkspaceFolder,
      ]

      // Reset mocks for this test
      vi.clearAllMocks()

      activate(mockContext)

      const registerCommandMock = vi.mocked(vscode.commands.registerCommand)
      const generateCall = registerCommandMock.mock.calls.find(
        call => call[0] === 'railsOpenapiGen.generate'
      )
      expect(generateCall).toBeDefined()

      const generateCommand = generateCall?.[1] as () => Promise<void>
      await generateCommand()

      expect(vscode.window.createTerminal).toHaveBeenCalledWith('Rails OpenAPI Gen')
      const mockTerminal = vi.mocked(vscode.window.createTerminal).mock.results[0]
        .value as vscode.Terminal
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { sendText: sendTextMock, show: showMock } = mockTerminal
      expect(sendTextMock).toHaveBeenCalledWith('cd "/test/workspace"')
      expect(sendTextMock).toHaveBeenCalledWith('bundle exec rails openapi:generate')
      expect(showMock).toHaveBeenCalled()
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'OpenAPI generation started'
      )
    })

    it('should handle errors gracefully', () => {
      const mockWorkspace = vi.mocked(vscode.workspace)
      mockWorkspace.workspaceFolders = [
        { uri: { fsPath: '/test/workspace' } } as vscode.WorkspaceFolder,
      ]

      // Reset mocks for this test
      vi.clearAllMocks()

      // Make terminal creation throw an error
      vi.mocked(vscode.window.createTerminal).mockImplementation(() => {
        throw new Error('Terminal creation failed')
      })

      // We expect activation to fail due to terminal creation error
      expect(() => activate(mockContext)).toThrow('Terminal creation failed')
    })
  })

  describe('railsOpenapiGen.check', () => {
    it('should create terminal and run check command', async () => {
      const mockWorkspace = vi.mocked(vscode.workspace)
      mockWorkspace.workspaceFolders = [
        { uri: { fsPath: '/test/workspace' } } as vscode.WorkspaceFolder,
      ]

      // Reset mocks for this test
      vi.clearAllMocks()

      activate(mockContext)

      const registerCommandMock = vi.mocked(vscode.commands.registerCommand)
      const checkCall = registerCommandMock.mock.calls.find(
        call => call[0] === 'railsOpenapiGen.check'
      )

      const checkCommand = checkCall?.[1] as () => Promise<void>
      await checkCommand()

      const mockTerminal = vi.mocked(vscode.window.createTerminal).mock.results[0]
        .value as vscode.Terminal
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const { sendText: sendTextMock, show: showMock } = mockTerminal
      expect(sendTextMock).toHaveBeenCalledWith('bundle exec rails openapi:check')
      expect(showMock).toHaveBeenCalled()
    })
  })

  describe('railsOpenapiGen.lint', () => {
    it('should lint active document', () => {
      const mockDocument = {
        uri: { toString: () => 'file:///test.rb' },
        languageId: 'ruby',
        getText: () => 'json.id user.id',
        lineAt: (_n: number) => ({ text: 'json.id user.id' }),
        lineCount: 1,
        version: 1,
      }

      vi.mocked(vscode.window).activeTextEditor = {
        document: mockDocument,
      } as vscode.TextEditor

      vi.mocked(vscode.workspace).textDocuments = [mockDocument as vscode.TextDocument]

      // Reset mocks for this test
      vi.clearAllMocks()

      activate(mockContext)

      const registerCommandMock = vi.mocked(vscode.commands.registerCommand)
      const lintCall = registerCommandMock.mock.calls.find(
        call => call[0] === 'railsOpenapiGen.lint'
      )

      const lintCommand = lintCall?.[1] as () => void
      lintCommand()

      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith('Linting completed')
    })

    it('should do nothing when no active editor', () => {
      vi.mocked(vscode.window).activeTextEditor = undefined

      // Reset mocks for this test
      vi.clearAllMocks()

      activate(mockContext)

      const registerCommandMock = vi.mocked(vscode.commands.registerCommand)
      const lintCall = registerCommandMock.mock.calls.find(
        call => call[0] === 'railsOpenapiGen.lint'
      )

      const lintCommand = lintCall?.[1] as () => void
      lintCommand()

      expect(vscode.window.showInformationMessage).not.toHaveBeenCalled()
    })
  })
})
