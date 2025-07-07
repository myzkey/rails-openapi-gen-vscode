import * as vscode from 'vscode'
import {
  CompletionPort,
  CompletionProvider,
  CompletionItem,
  CompletionItemKind,
  TextDocument,
  Position,
  Disposable,
} from '~/application/port/completion-port'

/**
 * VS Code implementation of CompletionPort
 */
export class VsCodeCompletionAdapter implements CompletionPort {
  registerCompletionProvider(
    provider: CompletionProvider,
    selector: string[],
    triggerCharacters?: string[]
  ): Disposable {
    const vsCodeProvider: vscode.CompletionItemProvider = {
      provideCompletionItems: async (document, position) => {
        const textDoc = this.convertDocument(document)
        const pos = this.convertPosition(position)
        const items = await provider.provideCompletionItems(textDoc, pos)

        return items.map(item => this.convertCompletionItem(item))
      },
    }

    const registration = vscode.languages.registerCompletionItemProvider(
      selector,
      vsCodeProvider,
      ...(triggerCharacters || [])
    )

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

  private convertCompletionItem(item: CompletionItem): vscode.CompletionItem {
    const vsCodeItem = new vscode.CompletionItem(
      item.label,
      this.convertCompletionItemKind(item.kind)
    )

    if (item.detail) {
      vsCodeItem.detail = item.detail
    }

    if (item.documentation) {
      vsCodeItem.documentation = item.documentation
    }

    if (item.insertText) {
      vsCodeItem.insertText = new vscode.SnippetString(item.insertText)
    }

    if (item.sortText) {
      vsCodeItem.sortText = item.sortText
    }

    return vsCodeItem
  }

  private convertCompletionItemKind(kind?: CompletionItemKind): vscode.CompletionItemKind {
    if (!kind) {
      return vscode.CompletionItemKind.Text
    }

    const kindMap: { [key: number]: vscode.CompletionItemKind } = {
      [CompletionItemKind.Text]: vscode.CompletionItemKind.Text,
      [CompletionItemKind.Method]: vscode.CompletionItemKind.Method,
      [CompletionItemKind.Function]: vscode.CompletionItemKind.Function,
      [CompletionItemKind.Constructor]: vscode.CompletionItemKind.Constructor,
      [CompletionItemKind.Field]: vscode.CompletionItemKind.Field,
      [CompletionItemKind.Variable]: vscode.CompletionItemKind.Variable,
      [CompletionItemKind.Class]: vscode.CompletionItemKind.Class,
      [CompletionItemKind.Interface]: vscode.CompletionItemKind.Interface,
      [CompletionItemKind.Module]: vscode.CompletionItemKind.Module,
      [CompletionItemKind.Property]: vscode.CompletionItemKind.Property,
      [CompletionItemKind.Unit]: vscode.CompletionItemKind.Unit,
      [CompletionItemKind.Value]: vscode.CompletionItemKind.Value,
      [CompletionItemKind.Enum]: vscode.CompletionItemKind.Enum,
      [CompletionItemKind.Keyword]: vscode.CompletionItemKind.Keyword,
      [CompletionItemKind.Snippet]: vscode.CompletionItemKind.Snippet,
      [CompletionItemKind.Color]: vscode.CompletionItemKind.Color,
      [CompletionItemKind.File]: vscode.CompletionItemKind.File,
      [CompletionItemKind.Reference]: vscode.CompletionItemKind.Reference,
    }

    return kindMap[kind] || vscode.CompletionItemKind.Text
  }
}
