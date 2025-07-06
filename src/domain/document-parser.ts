import { OpenApiComment } from './openapi-comment'
import { OpenApiOperation } from './openapi-operation'

/**
 * Domain service for parsing JBuilder documents
 */
export class DocumentParser {
  private static readonly OPENAPI_COMMENT_PATTERN = /@openapi\s+(.+)/
  private static readonly OPENAPI_OPERATION_START = /=begin/
  private static readonly OPENAPI_OPERATION_MARKER = /@openapi_operation/

  /**
   * Parse all OpenAPI comments from document text
   */
  static parseComments(documentText: string): OpenApiComment[] {
    const comments: OpenApiComment[] = []
    const lines = documentText.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const match = line.match(this.OPENAPI_COMMENT_PATTERN)

      if (match) {
        const commentText = match[1].trim()
        const comment = OpenApiComment.parse(i, commentText)
        comments.push(comment)
      }
    }

    return comments
  }

  /**
   * Parse all OpenAPI operation blocks from document text
   */
  static parseOperations(documentText: string): OpenApiOperation[] {
    const operations: OpenApiOperation[] = []
    const lines = documentText.split('\n')

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      if (this.OPENAPI_OPERATION_START.test(line)) {
        // Check if this is an operation block
        let hasOperationMarker = false
        for (let j = i; j < Math.min(i + 5, lines.length); j++) {
          if (this.OPENAPI_OPERATION_MARKER.test(lines[j])) {
            hasOperationMarker = true
            break
          }
        }

        if (hasOperationMarker) {
          const operation = OpenApiOperation.parse(lines, i)
          if (operation) {
            operations.push(operation)
            i = operation.endLine // Skip to end of operation
          }
        }
      }
    }

    return operations
  }

  /**
   * Check if a line is within an operation block
   */
  static isWithinOperation(line: number, operations: OpenApiOperation[]): boolean {
    return operations.some(op => op.containsLine(line))
  }

  /**
   * Find comment for a specific field
   */
  static findCommentForField(
    fieldName: string,
    fieldLine: number,
    comments: OpenApiComment[]
  ): OpenApiComment | undefined {
    // Look for comment within 3 lines above the field
    const searchStart = Math.max(0, fieldLine - 3)

    for (const comment of comments) {
      if (
        comment.line >= searchStart &&
        comment.line < fieldLine &&
        comment.fieldName === fieldName
      ) {
        return comment
      }
    }

    return undefined
  }
}
