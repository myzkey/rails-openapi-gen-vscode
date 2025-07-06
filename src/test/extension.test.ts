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

vi.mock('vscode', () => ({
  commands: {
    registerCommand: vi.fn(),
  },
  languages: {
    createDiagnosticCollection: vi.fn(),
    registerCompletionItemProvider: vi.fn(),
    registerHoverProvider: vi.fn(),
  },
  workspace: {
    onDidSaveTextDocument: vi.fn(),
    onDidChangeTextDocument: vi.fn(),
    workspaceFolders: [],
  },
  window: {
    createTerminal: vi.fn(),
    showInformationMessage: vi.fn(),
    showErrorMessage: vi.fn(),
  },
  ExtensionMode: {
    Test: 3,
  },
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

      expect(vscode.languages.registerCompletionItemProvider).toHaveBeenCalled()
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
  })

  describe('railsOpenapiGen.generate', () => {
    it('should create terminal and run rails command', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
      }

      const mockCreateTerminal = vi.mocked(vscode.window.createTerminal)
      mockCreateTerminal.mockReturnValue(mockTerminal as unknown as vscode.Terminal)

      const mockWorkspace = vi.mocked(vscode.workspace)
      mockWorkspace.workspaceFolders = [
        { uri: { fsPath: '/test/workspace' } },
      ] as vscode.WorkspaceFolder[]

      activate(mockContext)

      const registerCommandMock = vi.mocked(vscode.commands.registerCommand)
      const generateCall = registerCommandMock.mock.calls.find(
        call => call[0] === 'railsOpenapiGen.generate'
      )
      expect(generateCall).toBeDefined()

      const generateCommand = generateCall?.[1]
      if (!generateCommand) {
        throw new Error('Generate command not found')
      }
      generateCommand()

      expect(vscode.window.createTerminal).toHaveBeenCalledWith('Rails OpenAPI Gen')
      expect(mockTerminal.show).toHaveBeenCalled()
      expect(mockTerminal.sendText).toHaveBeenCalledWith('bundle exec rails openapi:generate')
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Running: bundle exec rails openapi:generate'
      )
    })

    it('should show error when no workspace folder', () => {
      const mockWorkspace = vi.mocked(vscode.workspace)
      mockWorkspace.workspaceFolders = undefined

      activate(mockContext)

      const registerCommandMock = vi.mocked(vscode.commands.registerCommand)
      const generateCall = registerCommandMock.mock.calls.find(
        call => call[0] === 'railsOpenapiGen.generate'
      )
      expect(generateCall).toBeDefined()

      const generateCommand = generateCall?.[1]
      if (!generateCommand) {
        throw new Error('Generate command not found')
      }
      generateCommand()

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder found')
      expect(vscode.window.createTerminal).not.toHaveBeenCalled()
    })
  })
})
