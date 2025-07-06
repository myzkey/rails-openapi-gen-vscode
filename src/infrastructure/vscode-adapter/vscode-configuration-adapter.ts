import * as vscode from 'vscode'
import {
  ConfigurationPort,
  ConfigurationChangeEvent,
  Disposable,
} from '../../application/port/configuration-port'

/**
 * VS Code implementation of ConfigurationPort
 */
export class VsCodeConfigurationAdapter implements ConfigurationPort {
  private readonly configSection = 'railsOpenapiGen'

  get<T>(key: string, defaultValue?: T): T {
    const config = vscode.workspace.getConfiguration(this.configSection)
    return config.get<T>(key, defaultValue as T)
  }

  onDidChangeConfiguration(listener: (event: ConfigurationChangeEvent) => void): Disposable {
    const subscription = vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(this.configSection)) {
        listener({
          affectsConfiguration: (key: string) =>
            e.affectsConfiguration(`${this.configSection}.${key}`),
        })
      }
    })

    return {
      dispose: (): void => {
        subscription.dispose()
      },
    }
  }
}
