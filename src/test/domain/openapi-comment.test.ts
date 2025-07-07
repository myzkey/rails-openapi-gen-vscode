import { describe, it, expect } from 'vitest'
import { OpenApiComment, OpenApiCommentParser, isValidOpenApiType } from '~/domain/openapi-comment'

describe('OpenApiComment', () => {
  describe('parse', () => {
    it('should parse simple field with type', () => {
      const comment = OpenApiComment.parse(10, 'id:integer')

      expect(comment.line).toBe(10)
      expect(comment.text).toBe('id:integer')
      expect(comment.fieldName).toBe('id')
      expect(comment.type).toBe('integer')
      expect(comment.isValid).toBe(true)
    })

    it('should parse comment with all attributes', () => {
      const comment = OpenApiComment.parse(
        20,
        'email:string required:true description:"User email" format:email example:"user@example.com"'
      )

      expect(comment.fieldName).toBe('email')
      expect(comment.type).toBe('string')
      expect(comment.isRequired).toBe(true)
      expect(comment.description).toBe('User email')
      expect(comment.attributes.format).toBe('email')
      expect(comment.attributes.example).toBe('user@example.com')
    })

    it('should handle missing type', () => {
      const comment = OpenApiComment.parse(30, 'field_without_type')

      expect(comment.isValid).toBe(false)
      expect(comment.fieldName).toBeUndefined()
      expect(comment.type).toBeUndefined()
    })
  })

  describe('isRequired', () => {
    it('should return true when required:true', () => {
      const comment = OpenApiComment.parse(0, 'field:string required:true')
      expect(comment.isRequired).toBe(true)
    })

    it('should return false when required:false', () => {
      const comment = OpenApiComment.parse(0, 'field:string required:false')
      expect(comment.isRequired).toBe(false)
    })

    it('should return false when required not specified', () => {
      const comment = OpenApiComment.parse(0, 'field:string')
      expect(comment.isRequired).toBe(false)
    })
  })
})

describe('OpenApiCommentParser', () => {
  describe('parseAttributes', () => {
    it('should parse name and type', () => {
      const attrs = OpenApiCommentParser.parseAttributes('userId:integer')

      expect(attrs.name).toBe('userId')
      expect(attrs.type).toBe('integer')
    })

    it('should parse required attribute', () => {
      const attrs1 = OpenApiCommentParser.parseAttributes('field:string required:true')
      expect(attrs1.required).toBe(true)

      const attrs2 = OpenApiCommentParser.parseAttributes('field:string required:false')
      expect(attrs2.required).toBe(false)

      const attrs3 = OpenApiCommentParser.parseAttributes('field:string Required:TRUE')
      expect(attrs3.required).toBe(true)
    })

    it('should parse description with quotes', () => {
      const attrs = OpenApiCommentParser.parseAttributes(
        'field:string description:"This is a test"'
      )
      expect(attrs.description).toBe('This is a test')
    })

    it('should parse format attribute', () => {
      const attrs = OpenApiCommentParser.parseAttributes('date:string format:date-time')
      expect(attrs.format).toBe('date-time')
    })

    it('should parse example attribute', () => {
      const attrs = OpenApiCommentParser.parseAttributes('field:string example:"test value"')
      expect(attrs.example).toBe('test value')
    })

    it('should parse multiple attributes', () => {
      const attrs = OpenApiCommentParser.parseAttributes(
        'email:string required:true description:"Email address" format:email example:"test@example.com"'
      )

      expect(attrs).toEqual({
        name: 'email',
        type: 'string',
        required: true,
        description: 'Email address',
        format: 'email',
        example: 'test@example.com',
      })
    })
  })
})

describe('isValidOpenApiType', () => {
  it('should return true for valid types', () => {
    expect(isValidOpenApiType('integer')).toBe(true)
    expect(isValidOpenApiType('string')).toBe(true)
    expect(isValidOpenApiType('boolean')).toBe(true)
    expect(isValidOpenApiType('number')).toBe(true)
    expect(isValidOpenApiType('array')).toBe(true)
    expect(isValidOpenApiType('object')).toBe(true)
    expect(isValidOpenApiType('null')).toBe(true)
  })

  it('should return false for invalid types', () => {
    expect(isValidOpenApiType('invalid')).toBe(false)
    expect(isValidOpenApiType('Integer')).toBe(false) // case sensitive
    expect(isValidOpenApiType('')).toBe(false)
  })
})
