import { describe, it, expect } from 'vitest'
import { JBuilderField, JBuilderFieldExtractor } from '~/domain/jbuilder-field'

describe('JBuilderField', () => {
  describe('shouldBeDocumented', () => {
    it('should return true for regular fields', () => {
      const field = new JBuilderField('user_id', 10, 5)
      expect(field.shouldBeDocumented()).toBe(true)
    })

    it('should return false for JBuilder methods', () => {
      const methods = [
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

      methods.forEach(method => {
        const field = new JBuilderField(method, 0, 0)
        expect(field.shouldBeDocumented()).toBe(false)
      })
    })

    it('should return false for fields starting with underscore', () => {
      const field = new JBuilderField('_internal', 0, 0)
      expect(field.shouldBeDocumented()).toBe(false)
    })

    it('should return false for meta field', () => {
      const field = new JBuilderField('meta', 0, 0)
      expect(field.shouldBeDocumented()).toBe(false)
    })
  })
})

describe('JBuilderFieldExtractor', () => {
  describe('extractFields', () => {
    it('should extract simple json fields', () => {
      const document = `
        json.id user.id
        json.name user.name
        json.email user.email
      `

      const fields = JBuilderFieldExtractor.extractFields(document)

      expect(fields).toHaveLength(3)
      expect(fields[0]).toMatchObject({ name: 'id', line: 1 })
      expect(fields[1]).toMatchObject({ name: 'name', line: 2 })
      expect(fields[2]).toMatchObject({ name: 'email', line: 3 })
    })

    it('should skip fields in partial! calls', () => {
      const document = `
        json.id user.id
        json.partial! 'user', user: user
        json.name user.name
      `

      const fields = JBuilderFieldExtractor.extractFields(document)

      expect(fields).toHaveLength(2)
      expect(fields[0].name).toBe('id')
      expect(fields[1].name).toBe('name')
    })

    it('should skip block patterns', () => {
      const document = `
        json.user do
          json.id user.id
          json.name user.name
        end
        json.email user.email
      `

      const fields = JBuilderFieldExtractor.extractFields(document)

      // Should skip 'user' but include nested fields and email
      expect(fields.map(f => f.name)).toEqual(['id', 'name', 'email'])
    })

    it('should handle multiple fields on same line', () => {
      const document = `json.id user.id; json.name user.name`

      const fields = JBuilderFieldExtractor.extractFields(document)

      expect(fields).toHaveLength(2)
      expect(fields[0].name).toBe('id')
      expect(fields[1].name).toBe('name')
    })

    it('should track correct line and column positions', () => {
      const document = `
        # Comment line
        json.field1 value
          json.field2 value
      `

      const fields = JBuilderFieldExtractor.extractFields(document)

      expect(fields[0]).toMatchObject({
        name: 'field1',
        line: 2,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        column: expect.any(Number),
      })
      expect(fields[1]).toMatchObject({
        name: 'field2',
        line: 3,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        column: expect.any(Number),
      })
    })
  })

  describe('findFieldsRequiringDocumentation', () => {
    it('should return unique field names', () => {
      const document = `
        json.id user.id
        json.name user.name
        json.id user.alternate_id  # duplicate field
        json.array! user.posts do |post|
          json.id post.id
        end
      `

      const fields = JBuilderFieldExtractor.findFieldsRequiringDocumentation(document)

      expect(fields).toBeInstanceOf(Set)
      expect(fields.has('id')).toBe(true)
      expect(fields.has('name')).toBe(true)
      expect(fields.size).toBe(2)
    })

    it('should exclude JBuilder methods', () => {
      const document = `
        json.id user.id
        json.name user.name
      `

      const fields = JBuilderFieldExtractor.findFieldsRequiringDocumentation(document)

      expect(fields.has('id')).toBe(true)
      expect(fields.has('name')).toBe(true)
      expect(fields.size).toBe(2)
    })

    it('should exclude special fields', () => {
      const document = `
        json.id user.id
        json._internal_field value
        json.meta { json.version 1 }
        json.name user.name
      `

      const fields = JBuilderFieldExtractor.findFieldsRequiringDocumentation(document)

      expect(fields.has('id')).toBe(true)
      expect(fields.has('name')).toBe(true)
      expect(fields.has('_internal_field')).toBe(false)
      expect(fields.has('meta')).toBe(false)
      expect(fields.has('version')).toBe(true)
      expect(fields.size).toBe(3)
    })
  })
})
