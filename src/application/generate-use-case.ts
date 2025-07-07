import { TerminalPort } from '~/application/port/terminal-port'

/**
 * Use case for generating OpenAPI documentation
 */
export class GenerateUseCase {
  constructor(private terminalPort: TerminalPort) {}

  /**
   * Execute rails openapi:generate command
   */
  async execute(workspaceFolder?: string): Promise<void> {
    const command = 'bundle exec rails openapi:generate'

    await this.terminalPort.execute(command, workspaceFolder)
    this.terminalPort.show()
  }
}
