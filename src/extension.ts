import * as vscode from 'vscode'

interface OpenApiComment {
  line: number
  text: string
  attributes: {
    name?: string
    type?: string
    required?: boolean
    description?: string
  }
}

export function activate(context: vscode.ExtensionContext) {
  const diagnosticCollection = vscode.languages.createDiagnosticCollection('rails-openapi-gen')
  context.subscriptions.push(diagnosticCollection)

  context.subscriptions.push(
    vscode.commands.registerCommand('railsOpenapiGen.generate', () => {
      runRailsCommand('openapi:generate')
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('railsOpenapiGen.check', () => {
      runRailsCommand('openapi:check')
    })
  )

  context.subscriptions.push(
    vscode.commands.registerCommand('railsOpenapiGen.lint', () => {
      const activeEditor = vscode.window.activeTextEditor
      if (activeEditor) {
        lintDocument(activeEditor.document, diagnosticCollection)
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(document => {
      const config = vscode.workspace.getConfiguration('railsOpenapiGen')

      if (isJbuilderFile(document)) {
        if (config.get<boolean>('lintOnSave')) {
          lintDocument(document, diagnosticCollection)
        }

        if (config.get<boolean>('generateOnSave')) {
          void runRailsCommand('openapi:generate')
        }
      }
    })
  )

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(event => {
      const config = vscode.workspace.getConfiguration('railsOpenapiGen')

      if (isJbuilderFile(event.document) && config.get<boolean>('lintOnChange')) {
        lintDocument(event.document, diagnosticCollection)
      }
    })
  )

  // Completion provider for @openapi comments
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ['ruby', 'erb'],
      {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
          const line = document.lineAt(position)
          const lineText = line.text.substring(0, position.character)

          // Check if we're in an @openapi comment
          if (!lineText.includes('@openapi')) {
            return undefined
          }

          const completionItems: vscode.CompletionItem[] = []

          // Field name completions - detect json.field patterns in the document
          if (lineText.match(/#\s*@openapi\s*$/)) {
            // Just typed "@openapi", suggest field names from json.* patterns
            const jsonFields = extractJsonFieldsFromDocument(document)
            jsonFields.forEach(fieldName => {
              const item = new vscode.CompletionItem(
                `${fieldName}:`,
                vscode.CompletionItemKind.Field
              )
              item.detail = `Field detected: json.${fieldName}`
              item.documentation = `Add OpenAPI documentation for json.${fieldName}`
              item.insertText = new vscode.SnippetString(
                `${fieldName}:\${1|integer,string,boolean,number,array,object|}`
              )
              item.sortText = `0_${fieldName}` // Sort field names first
              completionItems.push(item)
            })
          }

          // Type completions
          const types = ['integer', 'string', 'boolean', 'number', 'array', 'object', 'null']
          types.forEach(type => {
            const item = new vscode.CompletionItem(type, vscode.CompletionItemKind.TypeParameter)
            item.detail = `OpenAPI type: ${type}`
            item.documentation = `Sets the field type to ${type}`
            item.sortText = `1_${type}` // Sort types after field names
            completionItems.push(item)
          })

          // Attribute completions
          if (lineText.match(/\w+:\w+/)) {
            // Already has a type, suggest other attributes
            const requiredItem = new vscode.CompletionItem(
              'required:',
              vscode.CompletionItemKind.Property
            )
            requiredItem.insertText = 'required:true'
            requiredItem.detail = 'Marks field as required'
            requiredItem.documentation = 'Indicates whether this field is required in the response'
            completionItems.push(requiredItem)

            const descriptionItem = new vscode.CompletionItem(
              'description:',
              vscode.CompletionItemKind.Property
            )
            descriptionItem.insertText = new vscode.SnippetString('description:"$1"')
            descriptionItem.detail = 'Add field description'
            descriptionItem.documentation = 'Human-readable description of the field'
            completionItems.push(descriptionItem)

            const exampleItem = new vscode.CompletionItem(
              'example:',
              vscode.CompletionItemKind.Property
            )
            exampleItem.insertText = new vscode.SnippetString('example:"$1"')
            exampleItem.detail = 'Add example value'
            completionItems.push(exampleItem)

            const formatItem = new vscode.CompletionItem(
              'format:',
              vscode.CompletionItemKind.Property
            )
            formatItem.insertText = new vscode.SnippetString('format:"$1"')
            formatItem.detail = 'Add format specification'
            formatItem.documentation = 'Format hint (e.g., date-time, email, uuid)'
            completionItems.push(formatItem)
          }

          // Boolean values for required
          if (lineText.endsWith('required:')) {
            ;['true', 'false'].forEach(value => {
              const item = new vscode.CompletionItem(value, vscode.CompletionItemKind.Value)
              item.detail = `Boolean value: ${value}`
              completionItems.push(item)
            })
          }

          return completionItems
        },
      },
      ' ', // Trigger on space
      ':' // Trigger on colon
    )
  )

  // Snippet completion for @openapi
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ['ruby', 'erb'],
      {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
          const line = document.lineAt(position)
          const lineText = line.text.substring(0, position.character)

          // Check if we're in a block comment
          const inBlockComment = isInBlockComment(document, position)

          // Check if we should show completions
          const shouldShowCompletions =
            lineText.match(/#\s*@op/) || // Line comment with @op
            lineText.match(/#\s*@$/) || // Line comment ending with @
            (inBlockComment && lineText.match(/@op/)) || // Block comment with @op
            (inBlockComment && lineText.match(/@$/)) // Block comment ending with @

          if (!shouldShowCompletions) {
            return undefined
          }

          const completionItems: vscode.CompletionItem[] = []

          // Check if @ is already typed
          const hasAtSymbol = lineText.endsWith('@')

          // @openapi snippet
          const openapiItem = new vscode.CompletionItem(
            '@openapi',
            vscode.CompletionItemKind.Snippet
          )
          openapiItem.insertText = new vscode.SnippetString(
            hasAtSymbol
              ? 'openapi ${1:field}:${2|integer,string,boolean,number,array,object|} required:${3|true,false|} description:"${4:Description}"'
              : '@openapi ${1:field}:${2|integer,string,boolean,number,array,object|} required:${3|true,false|} description:"${4:Description}"'
          )
          openapiItem.detail = 'OpenAPI field documentation'
          openapiItem.documentation = 'Documents a JSON field for OpenAPI generation'
          completionItems.push(openapiItem)

          // Minimal @openapi snippet
          const minimalItem = new vscode.CompletionItem(
            '@openapi (minimal)',
            vscode.CompletionItemKind.Snippet
          )
          minimalItem.insertText = new vscode.SnippetString(
            hasAtSymbol
              ? 'openapi ${1:field}:${2|integer,string,boolean,number,array,object|}'
              : '@openapi ${1:field}:${2|integer,string,boolean,number,array,object|}'
          )
          minimalItem.detail = 'Minimal OpenAPI field documentation'
          minimalItem.documentation = 'Documents a JSON field with only the required type'
          minimalItem.filterText = '@openapi'
          completionItems.push(minimalItem)

          // @openapi_operation snippet for block comments
          if (inBlockComment) {
            const operationItem = new vscode.CompletionItem(
              '@openapi_operation',
              vscode.CompletionItemKind.Snippet
            )
            const operationContent = [
              hasAtSymbol ? 'openapi_operation' : '@openapi_operation',
              '  summary:"${1:Operation summary}"',
              '  tags:[${2:Tag1,Tag2}]',
              '  description:"${3:Detailed description}"',
              '  response_description:"${4:Response description}"',
            ].join('\n')
            operationItem.insertText = new vscode.SnippetString(operationContent)
            operationItem.detail = 'OpenAPI operation documentation'
            operationItem.documentation = 'Documents an API operation/endpoint'
            completionItems.push(operationItem)
          }

          return completionItems
        },
      },
      '@' // Trigger on @
    )
  )

  // Completion for operation attributes
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      ['ruby', 'erb'],
      {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
          const line = document.lineAt(position)
          const _lineText = line.text.substring(0, position.character).trim()

          // Check if we're in a block comment with @openapi_operation
          if (!isInOperationBlock(document, position)) {
            return undefined
          }

          const completionItems: vscode.CompletionItem[] = []

          // Operation attributes
          const attributes = [
            {
              name: 'summary:',
              snippet: 'summary:"${1:Summary}"',
              doc: 'Brief summary of the operation',
            },
            { name: 'tags:', snippet: 'tags:[${1:Tag1,Tag2}]', doc: 'Operation tags for grouping' },
            {
              name: 'description:',
              snippet: 'description:"${1:Description}"',
              doc: 'Detailed operation description',
            },
            {
              name: 'response_description:',
              snippet: 'response_description:"${1:Response}"',
              doc: 'Description of the response',
            },
            {
              name: 'parameters:',
              snippet: 'parameters:"${1:param1, param2}"',
              doc: 'Operation parameters',
            },
            {
              name: 'requestBody:',
              snippet: 'requestBody:"${1:Request body}"',
              doc: 'Request body description',
            },
            {
              name: 'responses:',
              snippet: 'responses:"${1:Response codes}"',
              doc: 'Response codes and descriptions',
            },
          ]

          attributes.forEach(attr => {
            const item = new vscode.CompletionItem(attr.name, vscode.CompletionItemKind.Property)
            item.insertText = new vscode.SnippetString(attr.snippet)
            item.detail = attr.doc
            completionItems.push(item)
          })

          return completionItems
        },
      },
      ' ', // Trigger on space
      '\n' // Trigger on newline
    )
  )

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(['ruby', 'erb'], {
      provideHover(document, position) {
        const line = document.lineAt(position.line)
        const openApiMatch = line.text.match(/#\s*@openapi\s+(.+)/)

        if (openApiMatch) {
          const attributes = parseOpenApiComment(openApiMatch[1])
          const markdown = new vscode.MarkdownString()

          // Show parsed field information
          if (attributes.name || attributes.type) {
            markdown.appendMarkdown('### OpenAPI Field\n\n')
            if (attributes.name) {
              markdown.appendMarkdown(`**Field:** \`${attributes.name}\`\n\n`)
            }
            if (attributes.type) {
              markdown.appendMarkdown(`**Type:** \`${attributes.type}\`\n\n`)
            }
            if (attributes.required !== undefined) {
              markdown.appendMarkdown(`**Required:** ${attributes.required}\n\n`)
            }
            if (attributes.description) {
              markdown.appendMarkdown(`**Description:** ${attributes.description}\n\n`)
            }
            markdown.appendMarkdown('---\n\n')
          }

          markdown.appendMarkdown('### OpenAPI Comment Format\n\n')
          markdown.appendMarkdown('**Required attribute:**\n')
          markdown.appendMarkdown('- `type`: Data type (integer, string, boolean, etc.)\n\n')
          markdown.appendMarkdown('**Optional attributes:**\n')
          markdown.appendMarkdown('- `required`: Whether the field is required (true/false)\n')
          markdown.appendMarkdown('- `description`: Human-readable description\n\n')
          markdown.appendMarkdown('**Example:**\n')
          markdown.appendCodeblock(
            '# @openapi id:integer\n# @openapi name:string required:true description:"User name"',
            'ruby'
          )

          return new vscode.Hover(markdown)
        }

        return null
      },
    })
  )

  if (vscode.window.activeTextEditor) {
    lintDocument(vscode.window.activeTextEditor.document, diagnosticCollection)
  }
}

export function deactivate() {}

function extractJsonFieldsFromDocument(document: vscode.TextDocument): string[] {
  const fields = new Set<string>()
  const jsonFieldPattern = /json\.(\w+)/g
  const blockPattern = /json\.(\w+)\s+do\s*$/
  const jbuilderMethods = [
    'array',
    'set!',
    'merge!',
    'extract!',
    'cache!',
    'cache_if!',
    'cache_root!',
    'ignore_nil!',
  ]

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    let match

    while ((match = jsonFieldPattern.exec(line.text)) !== null) {
      const fieldName = match[1]

      // Skip JBuilder methods and block patterns
      if (
        jbuilderMethods.includes(fieldName) ||
        blockPattern.test(line.text) ||
        line.text.match(/json\.\w+\s+.*\s+do(\s+\|.*\|)?\s*$/)
      ) {
        continue
      }

      // Skip partial calls
      if (line.text.includes('partial!')) {
        continue
      }

      fields.add(fieldName)
    }
  }

  return Array.from(fields).sort()
}

function isJbuilderFile(document: vscode.TextDocument): boolean {
  return document.fileName.endsWith('.jbuilder') || document.fileName.endsWith('.json.jbuilder')
}

function isInBlockComment(document: vscode.TextDocument, position: vscode.Position): boolean {
  let inBlock = false

  for (let i = 0; i < position.line; i++) {
    const line = document.lineAt(i).text
    if (line.match(/^=begin/)) {
      inBlock = true
    } else if (line.match(/^=end/)) {
      inBlock = false
    }
  }

  // Check current line
  const currentLine = document.lineAt(position.line).text
  if (currentLine.match(/^=begin/)) {
    return true
  }

  return inBlock
}

function isInOperationBlock(document: vscode.TextDocument, position: vscode.Position): boolean {
  if (!isInBlockComment(document, position)) {
    return false
  }

  // Look for @openapi_operation in the current block
  for (let i = position.line; i >= 0; i--) {
    const line = document.lineAt(i).text
    if (line.match(/^=begin/)) {
      // Found block start, now check if it contains @openapi_operation
      for (let j = i; j <= position.line; j++) {
        if (document.lineAt(j).text.includes('@openapi_operation')) {
          return true
        }
      }
      return false
    }
  }

  return false
}

function parseOpenApiComment(line: string): OpenApiComment['attributes'] {
  const attributes: OpenApiComment['attributes'] = {}

  // Parse name and type together from the beginning
  const nameTypeMatch = line.match(/^(\w+):(\w+)/)
  if (nameTypeMatch) {
    attributes.name = nameTypeMatch[1]
    attributes.type = nameTypeMatch[2]
  }

  const requiredMatch = line.match(/required:(true|false)/i)
  if (requiredMatch) {
    attributes.required = requiredMatch[1].toLowerCase() === 'true'
  }

  const descriptionMatch = line.match(/description:"([^"]*)"/)
  if (descriptionMatch) {
    attributes.description = descriptionMatch[1]
  }

  return attributes
}

function findOpenApiComments(document: vscode.TextDocument): OpenApiComment[] {
  const comments: OpenApiComment[] = []

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    const match = line.text.match(/#\s*@openapi\s+(.+)/)

    if (match) {
      comments.push({
        line: i,
        text: match[1],
        attributes: parseOpenApiComment(match[1]),
      })
    }
  }

  return comments
}

function lintDocument(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
) {
  const diagnostics: vscode.Diagnostic[] = []

  const openApiComments = findOpenApiComments(document)
  const jsonFieldPattern = /json\.(\w+)/g
  const documentedFields = new Set<string>()
  const blockPattern = /json\.(\w+)\s+do\s*$/

  openApiComments.forEach(comment => {
    const issues: string[] = []

    if (!comment.attributes.type) {
      issues.push('Missing type attribute')
    }

    if (issues.length > 0) {
      const line = document.lineAt(comment.line)
      const range = new vscode.Range(
        comment.line,
        line.text.indexOf('@openapi'),
        comment.line,
        line.text.length
      )

      const diagnostic = new vscode.Diagnostic(
        range,
        `OpenAPI comment issues: ${issues.join(', ')}`,
        vscode.DiagnosticSeverity.Warning
      )

      diagnostics.push(diagnostic)
    }

    if (comment.attributes.name) {
      documentedFields.add(comment.attributes.name)
    }
  })

  for (let i = 0; i < document.lineCount; i++) {
    const line = document.lineAt(i)
    let match

    while ((match = jsonFieldPattern.exec(line.text)) !== null) {
      const fieldName = match[1]
      const isPartial = line.text.includes('partial!')

      // Skip JBuilder methods that are not actual fields
      const jbuilderMethods = [
        'array',
        'set!',
        'merge!',
        'extract!',
        'cache!',
        'cache_if!',
        'cache_root!',
        'ignore_nil!',
      ]
      if (jbuilderMethods.includes(fieldName)) {
        continue
      }

      // Skip if this is a block (e.g., json.user do, json.tags @data do |item|)
      if (blockPattern.test(line.text) || line.text.match(/json\.\w+\s+.*\s+do(\s+\|.*\|)?\s*$/)) {
        continue
      }

      if (!isPartial && !documentedFields.has(fieldName)) {
        let hasComment = false
        for (let j = Math.max(0, i - 3); j <= i; j++) {
          const checkLine = document.lineAt(j)
          if (checkLine.text.includes('@openapi') && checkLine.text.includes(fieldName)) {
            hasComment = true
            documentedFields.add(fieldName)
            break
          }
        }

        if (!hasComment) {
          const range = new vscode.Range(i, match.index, i, match.index + match[0].length)

          const diagnostic = new vscode.Diagnostic(
            range,
            `Field '${fieldName}' is missing @openapi comment`,
            vscode.DiagnosticSeverity.Error
          )

          diagnostics.push(diagnostic)
        }
      }
    }
  }

  diagnosticCollection.set(document.uri, diagnostics)
}

function runRailsCommand(command: string) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]

  if (!workspaceFolder) {
    vscode.window.showErrorMessage('No workspace folder found')
    return
  }

  const terminal = vscode.window.createTerminal('Rails OpenAPI Gen')
  terminal.show()

  const railsCommand = `bundle exec rails ${command}`
  terminal.sendText(railsCommand)

  vscode.window.showInformationMessage(`Running: ${railsCommand}`)
}
