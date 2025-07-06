import { describe, it, expect } from 'vitest'
import {
  LintViolation,
  LintSeverity,
  LintRule,
  TypeRequiredRule,
  MissingDocumentationRule,
  LintRuleRunner,
  LintContext,
} from '../../domain/lint-rule'
import { OpenApiComment } from '../../domain/openapi-comment'
import { JBuilderField } from '../../domain/jbuilder-field'

describe('TypeRequiredRule', () => {
  const rule = new TypeRequiredRule()

  it('should have correct name', () => {
    expect(rule.name).toBe('type-required')
  })

  it('should report violation for missing type', () => {
    const context: LintContext = {
      documentText: '',
      comments: [
        OpenApiComment.parse(10, 'field_without_type'),
        OpenApiComment.parse(20, 'another_field'),
      ],
      fields: [],
      lines: [],
    }

    const violations = rule.validate(context)

    expect(violations).toHaveLength(2)
    expect(violations[0]).toMatchObject({
      line: 10,
      column: 0,
      message: '@openapi comment missing required "type" attribute',
      severity: LintSeverity.ERROR,
      rule: 'type-required',
    })
  })

  it('should not report violation for valid comments', () => {
    const context: LintContext = {
      documentText: '',
      comments: [
        OpenApiComment.parse(10, 'id:integer'),
        OpenApiComment.parse(20, 'name:string required:true'),
      ],
      fields: [],
      lines: [],
    }

    const violations = rule.validate(context)

    expect(violations).toHaveLength(0)
  })
})

describe('MissingDocumentationRule', () => {
  const rule = new MissingDocumentationRule()

  it('should have correct name', () => {
    expect(rule.name).toBe('missing-documentation')
  })

  it('should report violation for undocumented fields', () => {
    const lines = [
      '# @openapi id:integer',
      'json.id user.id',
      'json.name user.name', // This field is not documented
      'json.email user.email', // This field is not documented
    ]

    const context: LintContext = {
      documentText: lines.join('\n'),
      comments: [OpenApiComment.parse(0, 'id:integer')],
      fields: [
        new JBuilderField('id', 1, 5),
        new JBuilderField('name', 2, 5),
        new JBuilderField('email', 3, 5),
      ],
      lines,
    }

    const violations = rule.validate(context)

    expect(violations).toHaveLength(2)
    expect(violations[0]).toMatchObject({
      line: 2,
      column: 5,
      message: 'Missing @openapi documentation for field: name',
      severity: LintSeverity.WARNING,
      rule: 'missing-documentation',
    })
    expect(violations[1]).toMatchObject({
      line: 3,
      column: 5,
      message: 'Missing @openapi documentation for field: email',
      severity: LintSeverity.WARNING,
      rule: 'missing-documentation',
    })
  })

  it('should not report violation for documented fields', () => {
    const lines = [
      '# @openapi id:integer',
      'json.id user.id',
      '# @openapi name:string',
      'json.name user.name',
    ]

    const context: LintContext = {
      documentText: lines.join('\n'),
      comments: [OpenApiComment.parse(0, 'id:integer'), OpenApiComment.parse(2, 'name:string')],
      fields: [new JBuilderField('id', 1, 5), new JBuilderField('name', 3, 5)],
      lines,
    }

    const violations = rule.validate(context)

    expect(violations).toHaveLength(0)
  })

  it('should check for comments within 3 lines above', () => {
    const lines = [
      '# @openapi id:integer',
      '# Some other comment',
      '# Another comment',
      'json.id user.id', // Within 3 lines of comment
      '',
      '',
      '',
      '',
      'json.name user.name', // Too far from any comment
    ]

    const context: LintContext = {
      documentText: lines.join('\n'),
      comments: [OpenApiComment.parse(0, 'id:integer')],
      fields: [new JBuilderField('id', 3, 5), new JBuilderField('name', 8, 5)],
      lines,
    }

    const violations = rule.validate(context)

    expect(violations).toHaveLength(1)
    expect(violations[0].message).toContain('name')
  })

  it('should not report duplicates for same field name', () => {
    const lines = [
      'json.id user.id',
      'json.id post.id', // Same field name
      'json.id comment.id', // Same field name again
    ]

    const context: LintContext = {
      documentText: lines.join('\n'),
      comments: [],
      fields: [
        new JBuilderField('id', 0, 5),
        new JBuilderField('id', 1, 5),
        new JBuilderField('id', 2, 5),
      ],
      lines,
    }

    const violations = rule.validate(context)

    expect(violations).toHaveLength(1) // Only one violation for 'id'
  })

  it('should skip JBuilder methods', () => {
    const context: LintContext = {
      documentText: '',
      comments: [],
      fields: [
        new JBuilderField('array', 0, 5),
        new JBuilderField('set!', 1, 5),
        new JBuilderField('regular_field', 2, 5),
      ],
      lines: ['', '', ''],
    }

    const violations = rule.validate(context)

    // Should only report violation for regular_field
    expect(violations).toHaveLength(1)
    expect(violations[0].message).toContain('regular_field')
  })
})

describe('LintRuleRunner', () => {
  it('should run all rules', () => {
    const runner = new LintRuleRunner()

    const lines = [
      '# @openapi missing_type', // Will trigger TypeRequiredRule
      'json.undocumented_field value', // Will trigger MissingDocumentationRule
    ]

    const context: LintContext = {
      documentText: lines.join('\n'),
      comments: [OpenApiComment.parse(0, 'missing_type')],
      fields: [new JBuilderField('undocumented_field', 1, 5)],
      lines,
    }

    const violations = runner.run(context)

    expect(violations).toHaveLength(2)
    expect(violations.some(v => v.rule === 'type-required')).toBe(true)
    expect(violations.some(v => v.rule === 'missing-documentation')).toBe(true)
  })

  it('should allow adding custom rules', () => {
    const runner = new LintRuleRunner()

    class CustomRule extends LintRule {
      readonly name = 'custom-rule'

      validate(context: LintContext): LintViolation[] {
        // Same logic as TypeRequiredRule but with different name
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

    runner.addRule(new CustomRule())

    const context: LintContext = {
      documentText: '',
      comments: [OpenApiComment.parse(0, 'no_type')],
      fields: [],
      lines: [],
    }

    const violations = runner.run(context)

    // Should have violations from both default TypeRequiredRule and CustomRule
    expect(violations.filter(v => v.rule === 'type-required')).toHaveLength(1)
    expect(violations.filter(v => v.rule === 'custom-rule')).toHaveLength(1)
  })
})
