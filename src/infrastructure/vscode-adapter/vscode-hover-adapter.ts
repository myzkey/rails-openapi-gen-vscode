import * as vscode from 'vscode'
import {
  HoverPort,
  HoverProvider,
  Hover,
  TextDocument,
  Position,
  Disposable,
} from '../../application/port/hover-port'

/**
 * VS Code implementation of HoverPort
 */
export class VsCodeHoverAdapter implements HoverPort {
  registerHoverProvider(provider: HoverProvider, selector: string[]): Disposable {
    const vsCodeProvider: vscode.HoverProvider = {
      provideHover: async (document, position) => {
        const textDoc = this.convertDocument(document)
        const pos = this.convertPosition(position)
        const hover = await provider.provideHover(textDoc, pos)

        return hover ? this.convertHover(hover) : undefined
      },
    }

    const registration = vscode.languages.registerHoverProvider(selector, vsCodeProvider)

    return {
      dispose: (): void => {
        registration.dispose()
      },
    }
  }

  private convertDocument(vsCodeDoc: vscode.TextDocument): TextDocument {
    return {
      uri: vsCodeDoc.uri.toString(),
      languageId: vsCodeDoc.languageId,
      version: vsCodeDoc.version,
      getText: () => vsCodeDoc.getText(),
      getLineAt: (line: number) => vsCodeDoc.lineAt(line).text,
      getLineCount: () => vsCodeDoc.lineCount,
    }
  }

  private convertPosition(vsCodePos: vscode.Position): Position {
    return {
      line: vsCodePos.line,
      character: vsCodePos.character,
    }
  }

  private convertHover(hover: Hover): vscode.Hover {
    const contents = hover.contents.map(content => new vscode.MarkdownString(content))

    let range: vscode.Range | undefined
    if (hover.range) {
      range = new vscode.Range(
        hover.range.start.line,
        hover.range.start.character,
        hover.range.end.line,
        hover.range.end.character
      )
    }

    return new vscode.Hover(contents, range)
  }
}
