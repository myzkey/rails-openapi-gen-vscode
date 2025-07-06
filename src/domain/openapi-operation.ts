/**
 * Domain entity representing an OpenAPI operation comment block
 */
export class OpenApiOperation {
  constructor(
    public readonly startLine: number,
    public readonly endLine: number,
    public readonly attributes: OpenApiOperationAttributes
  ) {}

  static parse(lines: string[], startLine: number): OpenApiOperation | null {
    const attributes: OpenApiOperationAttributes = {}
    let endLine = startLine
    let inOperationBlock = false

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i]

      if (line.includes('@openapi_operation')) {
        inOperationBlock = true
        continue
      }

      if (line.includes('=end')) {
        endLine = i
        break
      }

      if (inOperationBlock) {
        this.parseAttribute(line, attributes)
      }
    }

    if (!inOperationBlock) {
      return null
    }

    return new OpenApiOperation(startLine, endLine, attributes)
  }

  private static parseAttribute(line: string, attributes: OpenApiOperationAttributes): void {
    const summaryMatch = line.match(/summary:\s*"([^"]*)"/)
    if (summaryMatch) {
      attributes.summary = summaryMatch[1]
    }

    const tagsMatch = line.match(/tags:\s*\[(.*?)\]/)
    if (tagsMatch) {
      attributes.tags = tagsMatch[1].split(',').map(tag => tag.trim().replace(/["']/g, ''))
    }

    const descriptionMatch = line.match(/description:\s*"([^"]*)"/)
    if (descriptionMatch) {
      attributes.description = descriptionMatch[1]
    }

    const responseDescMatch = line.match(/response_description:\s*"([^"]*)"/)
    if (responseDescMatch) {
      attributes.responseDescription = responseDescMatch[1]
    }
  }

  containsLine(line: number): boolean {
    return line >= this.startLine && line <= this.endLine
  }
}

/**
 * Value object representing OpenAPI operation attributes
 */
export interface OpenApiOperationAttributes {
  summary?: string
  tags?: string[]
  description?: string
  responseDescription?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters?: any[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  requestBody?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responses?: any
}
