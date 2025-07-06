/**
 * Domain entity representing an OpenAPI comment in JBuilder files
 */
export class OpenApiComment {
  constructor(
    public readonly line: number,
    public readonly text: string,
    public readonly attributes: OpenApiCommentAttributes
  ) {}

  static parse(line: number, text: string): OpenApiComment {
    const attributes = OpenApiCommentParser.parseAttributes(text)
    return new OpenApiComment(line, text, attributes)
  }

  get isValid(): boolean {
    return this.attributes.type !== undefined
  }

  get fieldName(): string | undefined {
    return this.attributes.name
  }

  get type(): string | undefined {
    return this.attributes.type
  }

  get isRequired(): boolean {
    return this.attributes.required === true
  }

  get description(): string | undefined {
    return this.attributes.description
  }
}

/**
 * Value object representing OpenAPI comment attributes
 */
export interface OpenApiCommentAttributes {
  name?: string
  type?: string
  required?: boolean
  description?: string
  format?: string
  example?: string
}

/**
 * Domain service for parsing OpenAPI comment attributes
 */
export class OpenApiCommentParser {
  private static readonly NAME_TYPE_PATTERN = /^(\w+):(\w+)/
  private static readonly REQUIRED_PATTERN = /required:(true|false)/i
  private static readonly DESCRIPTION_PATTERN = /description:"([^"]*)"/
  private static readonly FORMAT_PATTERN = /format:([\w-]+)/
  private static readonly EXAMPLE_PATTERN = /example:"([^"]*)"/

  static parseAttributes(text: string): OpenApiCommentAttributes {
    const attributes: OpenApiCommentAttributes = {}

    // Parse name and type
    const nameTypeMatch = text.match(this.NAME_TYPE_PATTERN)
    if (nameTypeMatch) {
      attributes.name = nameTypeMatch[1]
      attributes.type = nameTypeMatch[2]
    }

    // Parse required
    const requiredMatch = text.match(this.REQUIRED_PATTERN)
    if (requiredMatch) {
      attributes.required = requiredMatch[1].toLowerCase() === 'true'
    }

    // Parse description
    const descriptionMatch = text.match(this.DESCRIPTION_PATTERN)
    if (descriptionMatch) {
      attributes.description = descriptionMatch[1]
    }

    // Parse format
    const formatMatch = text.match(this.FORMAT_PATTERN)
    if (formatMatch) {
      attributes.format = formatMatch[1]
    }

    // Parse example
    const exampleMatch = text.match(this.EXAMPLE_PATTERN)
    if (exampleMatch) {
      attributes.example = exampleMatch[1]
    }

    return attributes
  }
}

/**
 * Supported OpenAPI data types
 */
export enum OpenApiType {
  INTEGER = 'integer',
  STRING = 'string',
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  ARRAY = 'array',
  OBJECT = 'object',
  NULL = 'null',
}

/**
 * Type guard to check if a string is a valid OpenAPI type
 */
export function isValidOpenApiType(type: string): type is OpenApiType {
  return Object.values(OpenApiType).includes(type as OpenApiType)
}
