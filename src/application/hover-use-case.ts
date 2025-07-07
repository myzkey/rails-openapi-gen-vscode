import { Hover, TextDocument, Position } from '~/application/port/hover-port'
import { OpenApiComment } from '~/domain/openapi-comment'

/**
 * Use case for providing hover information
 */
export class HoverUseCase {
  /**
   * Get hover information for @openapi comments
   */
  getHover(document: TextDocument, position: Position): Hover | undefined {
    const line = document.getLineAt(position.line)

    // Check if hovering over an @openapi comment
    if (!line.includes('@openapi')) {
      return undefined
    }

    // Parse the comment
    const match = line.match(/@openapi\s+(.+)/)
    if (!match) {
      return undefined
    }

    const commentText = match[1].trim()
    const comment = OpenApiComment.parse(position.line, commentText)

    // Build hover content
    const contents: string[] = []

    contents.push('**OpenAPI Documentation**')
    contents.push('')

    if (comment.fieldName) {
      contents.push(`**Field**: \`${comment.fieldName}\``)
    }

    if (comment.type) {
      contents.push(`**Type**: \`${comment.type}\``)
    }

    if (comment.isRequired) {
      contents.push(`**Required**: Yes`)
    }

    if (comment.description) {
      contents.push(`**Description**: ${comment.description}`)
    }

    if (comment.attributes.format) {
      contents.push(`**Format**: \`${comment.attributes.format}\``)
    }

    if (comment.attributes.example) {
      contents.push(`**Example**: \`${comment.attributes.example}\``)
    }

    // Add validation status
    if (!comment.isValid) {
      contents.push('')
      contents.push('⚠️ **Warning**: Missing required `type` attribute')
    }

    return {
      contents,
    }
  }
}
