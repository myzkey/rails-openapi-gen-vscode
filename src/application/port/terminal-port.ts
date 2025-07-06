/**
 * Port interface for terminal operations
 * This abstraction allows the application layer to execute commands
 * without depending on specific terminal implementations
 */
export interface TerminalPort {
  /**
   * Execute a command in the terminal
   * @param command The command to execute
   * @param cwd Optional working directory
   * @returns Promise that resolves when command completes
   */
  execute(command: string, cwd?: string): Promise<void>

  /**
   * Show the terminal to the user
   */
  show(): void

  /**
   * Dispose of the terminal
   */
  dispose(): void
}
