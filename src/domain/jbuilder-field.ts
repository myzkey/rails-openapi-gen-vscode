/**
 * Domain entity representing a JSON field in JBuilder template
 */
export class JBuilderField {
  constructor(
    public readonly name: string,
    public readonly line: number,
    public readonly column: number
  ) {}

  /**
   * Check if this field should be documented
   */
  shouldBeDocumented(): boolean {
    return !this.isJBuilderMethod() && !this.isSpecialField()
  }

  private isJBuilderMethod(): boolean {
    const jbuilderMethods = [
      'array',
      'set!',
      'merge!',
      'cache!',
      'cache_if!',
      'cache_root!',
      'extract!',
      'partial!',
      'child!',
      'attributes!',
      'ignore_nil!',
      'deep_format_keys!',
      'key_format!',
    ]
    return jbuilderMethods.includes(this.name)
  }

  private isSpecialField(): boolean {
    // Fields that might not need documentation
    return this.name.startsWith('_') || this.name === 'meta'
  }
}

/**
 * Domain service for extracting JBuilder fields from document text
 */
export class JBuilderFieldExtractor {
  private static readonly JSON_FIELD_PATTERN = /json\.(\w+)/g
  private static readonly BLOCK_PATTERN = /json\.(\w+)\s+do\s*$/
  private static readonly PARTIAL_PATTERN = /partial!/

  static extractFields(documentText: string): JBuilderField[] {
    const fields: JBuilderField[] = []
    const lines = documentText.split('\n')

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]

      // Skip lines with partial! calls
      if (this.PARTIAL_PATTERN.test(line)) {
        continue
      }

      // Skip block patterns
      if (this.BLOCK_PATTERN.test(line)) {
        continue
      }

      // Extract fields
      let match
      const regex = new RegExp(this.JSON_FIELD_PATTERN)
      while ((match = regex.exec(line)) !== null) {
        const fieldName = match[1]
        const column = match.index
        fields.push(new JBuilderField(fieldName, lineIndex, column))
      }
    }

    return fields
  }

  /**
   * Find unique field names that should be documented
   */
  static findFieldsRequiringDocumentation(documentText: string): Set<string> {
    const fields = this.extractFields(documentText)
    const uniqueFieldNames = new Set<string>()

    for (const field of fields) {
      if (field.shouldBeDocumented()) {
        uniqueFieldNames.add(field.name)
      }
    }

    return uniqueFieldNames
  }
}
