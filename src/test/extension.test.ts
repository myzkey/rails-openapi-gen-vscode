import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as vscode from 'vscode'
import { activate, deactivate } from '../extension'

describe('Extension Test Suite', () => {
  let mockContext: vscode.ExtensionContext

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks()

    // Create mock context
    mockContext = {
      subscriptions: [],
      extensionUri: {} as vscode.Uri,
      extensionPath: '/test/path',
      asAbsolutePath: vi.fn((path) => `/test/path/${path}`),
      storagePath: '/test/storage',
      globalStoragePath: '/test/global-storage',
      logPath: '/test/logs',
      extensionMode: vscode.ExtensionMode.Test,
      storageUri: {} as vscode.Uri,
      globalStorageUri: {} as vscode.Uri,
      logUri: {} as vscode.Uri,
      extension: {} as vscode.Extension<any>,
      workspaceState: {
        get: vi.fn(),
        update: vi.fn(),
        keys: vi.fn(() => []),
      },
      globalState: {
        get: vi.fn(),
        update: vi.fn(),
        keys: vi.fn(() => []),
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
      },
    }
  })

  describe('activate', () => {
    it('should register all commands', () => {
      activate(mockContext)

      // Check that commands were registered
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

      expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith(
        'rails-openapi-gen'
      )
    })

    it('should register completion providers', () => {
      activate(mockContext)

      // Should register multiple completion providers
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
    mockContext = {
      subscriptions: [],
    } as any
  })

  describe('railsOpenapiGen.generate', () => {
    it('should create terminal and run rails command', () => {
      const mockTerminal = {
        show: vi.fn(),
        sendText: vi.fn(),
      }
      ;(vscode.window.createTerminal as any).mockReturnValue(mockTerminal)
      ;(vscode.workspace as any).workspaceFolders = [{ uri: { fsPath: '/test/workspace' } }]

      activate(mockContext)

      // Find and execute the generate command
      const generateCommand = (vscode.commands.registerCommand as any).mock.calls.find(
        (call: any) => call[0] === 'railsOpenapiGen.generate'
      )?.[1]

      expect(generateCommand).toBeDefined()

      // Execute the command
      generateCommand()

      expect(vscode.window.createTerminal).toHaveBeenCalledWith('Rails OpenAPI Gen')
      expect(mockTerminal.show).toHaveBeenCalled()
      expect(mockTerminal.sendText).toHaveBeenCalledWith('bundle exec rails openapi:generate')
      expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
        'Running: bundle exec rails openapi:generate'
      )
    })

    it('should show error when no workspace folder', () => {
      ;(vscode.workspace as any).workspaceFolders = undefined

      activate(mockContext)

      const generateCommand = (vscode.commands.registerCommand as any).mock.calls.find(
        (call: any) => call[0] === 'railsOpenapiGen.generate'
      )?.[1]

      generateCommand()

      expect(vscode.window.showErrorMessage).toHaveBeenCalledWith('No workspace folder found')
      expect(vscode.window.createTerminal).not.toHaveBeenCalled()
    })
  })
})