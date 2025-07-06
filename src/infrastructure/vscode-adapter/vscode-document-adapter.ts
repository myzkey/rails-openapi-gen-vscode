import * as vscode from 'vscode'
import { DocumentPort, Disposable } from '../../application/port/document-port'
import { TextDocument } from '../../application/port/completion-port'

/**
 * VS Code implementation of DocumentPort
 */
export class VsCodeDocumentAdapter implements DocumentPort {
  getAllDocuments(): TextDocument[] {
    return vscode.workspace.textDocuments.map(doc => this.convertDocument(doc))
  }

  getDocument(uri: string): TextDocument | undefined {
    const vsCodeUri = vscode.Uri.parse(uri)
    const doc = vscode.workspace.textDocuments.find(d => d.uri.toString() === vsCodeUri.toString())

    return doc ? this.convertDocument(doc) : undefined
  }

  onDidChangeDocument(listener: (document: TextDocument) => void): Disposable {
    const subscription = vscode.workspace.onDidChangeTextDocument(event => {
      listener(this.convertDocument(event.document))
    })

    return {
      dispose: (): void => {
        subscription.dispose()
      },
    }
  }

  onDidOpenDocument(listener: (document: TextDocument) => void): Disposable {
    const subscription = vscode.workspace.onDidOpenTextDocument(doc => {
      listener(this.convertDocument(doc))
    })

    return {
      dispose: (): void => {
        subscription.dispose()
      },
    }
  }

  onDidSaveDocument(listener: (document: TextDocument) => void): Disposable {
    const subscription = vscode.workspace.onDidSaveTextDocument(doc => {
      listener(this.convertDocument(doc))
    })

    return {
      dispose: (): void => {
        subscription.dispose()
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
}
