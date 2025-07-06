/**
 * Port interface for configuration operations
 */
export interface ConfigurationPort {
  /**
   * Get a configuration value
   * @param key The configuration key
   * @param defaultValue Default value if not found
   */
  get<T>(key: string, defaultValue?: T): T

  /**
   * Register a configuration change listener
   * @param listener The listener function
   * @returns Disposable to unregister the listener
   */
  onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => void): Disposable
}

/**
 * Configuration change event
 */
export interface ConfigurationChangeEvent {
  /**
   * Check if a configuration affects the given key
   * @param key The configuration key
   */
  affectsConfiguration(key: string): boolean
}

/**
 * Disposable resource
 */
export interface Disposable {
  dispose(): void
}
