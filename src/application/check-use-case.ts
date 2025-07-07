import { TerminalPort } from '~/application/port/terminal-port'

/**
 * Use case for checking OpenAPI documentation
 */
export class CheckUseCase {
  constructor(private terminalPort: TerminalPort) {}

  /**
   * Execute rails openapi:check command
   */
  async execute(workspaceFolder?: string): Promise<void> {
    const command = 'bundle exec rails openapi:check'

    await this.terminalPort.execute(command, workspaceFolder)
    this.terminalPort.show()
  }
}
