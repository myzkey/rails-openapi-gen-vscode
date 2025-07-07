import * as vscode from 'vscode'
import { TerminalPort } from '~/application/port/terminal-port'

/**
 * VS Code implementation of TerminalPort
 */
export class VsCodeTerminalAdapter implements TerminalPort {
  private terminal: vscode.Terminal

  constructor(name: string = 'Rails OpenAPI Gen') {
    this.terminal = vscode.window.createTerminal(name)
  }

  execute(command: string, cwd?: string): Promise<void> {
    if (cwd) {
      // Change to the specified directory first
      this.terminal.sendText(`cd "${cwd}"`)
    }

    this.terminal.sendText(command)
    return Promise.resolve()
  }

  show(): void {
    this.terminal.show()
  }

  dispose(): void {
    this.terminal.dispose()
  }
}
