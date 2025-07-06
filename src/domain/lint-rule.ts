import { OpenApiComment } from './openapi-comment'
import { JBuilderField } from './jbuilder-field'

/**
 * Domain entity representing a lint violation
 */
export class LintViolation {
  constructor(
    public readonly line: number,
    public readonly column: number,
    public readonly message: string,
    public readonly severity: LintSeverity,
    public readonly rule: string
  ) {}
}

export enum LintSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * Abstract base class for lint rules
 */
export abstract class LintRule {
  abstract readonly name: string
  abstract validate(context: LintContext): LintViolation[]
}

/**
 * Context provided to lint rules
 */
export interface LintContext {
  documentText: string
  comments: OpenApiComment[]
  fields: JBuilderField[]
  lines: string[]
}

/**
 * Lint rule: Every @openapi comment must have a type attribute
 */
export class TypeRequiredRule extends LintRule {
  readonly name = 'type-required'

  validate(context: LintContext): LintViolation[] {
    const violations: LintViolation[] = []

    for (const comment of context.comments) {
      if (!comment.type) {
        violations.push(
          new LintViolation(
            comment.line,
            0,
            '@openapi comment missing required "type" attribute',
            LintSeverity.ERROR,
            this.name
          )
        )
      }
    }

    return violations
  }
}

/**
 * Lint rule: Every json field should have an @openapi comment
 */
export class MissingDocumentationRule extends LintRule {
  readonly name = 'missing-documentation'

  validate(context: LintContext): LintViolation[] {
    const violations: LintViolation[] = []
    const documentedFields = new Set<string>()

    // Collect all documented field names
    for (const comment of context.comments) {
      if (comment.fieldName) {
        documentedFields.add(comment.fieldName)
      }
    }

    // Check each field
    const processedFields = new Set<string>()
    for (const field of context.fields) {
      if (
        field.shouldBeDocumented() &&
        !documentedFields.has(field.name) &&
        !processedFields.has(field.name)
      ) {
        // Check if there's a comment within 3 lines above
        const hasNearbyComment = this.hasCommentNearby(field.line, field.name, context.lines)

        if (!hasNearbyComment) {
          violations.push(
            new LintViolation(
              field.line,
              field.column,
              `Missing @openapi documentation for field: ${field.name}`,
              LintSeverity.WARNING,
              this.name
            )
          )
          processedFields.add(field.name)
        }
      }
    }

    return violations
  }

  private hasCommentNearby(fieldLine: number, fieldName: string, lines: string[]): boolean {
    const searchStart = Math.max(0, fieldLine - 3)

    for (let i = searchStart; i < fieldLine; i++) {
      const line = lines[i]
      if (line.includes('@openapi') && line.includes(fieldName)) {
        return true
      }
    }

    return false
  }
}

/**
 * Composite lint rule runner
 */
export class LintRuleRunner {
  private rules: LintRule[] = [new TypeRequiredRule(), new MissingDocumentationRule()]

  addRule(rule: LintRule): void {
    this.rules.push(rule)
  }

  run(context: LintContext): LintViolation[] {
    const violations: LintViolation[] = []

    for (const rule of this.rules) {
      violations.push(...rule.validate(context))
    }

    return violations
  }
}
