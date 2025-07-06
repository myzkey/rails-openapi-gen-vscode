# Rails OpenAPI Gen VSCode Extension

VSCode extension for [rails-openapi-gen](https://github.com/myzkey/rails-openapi-gen) that provides syntax highlighting, linting, and code generation support for OpenAPI comments in Rails JBuilder templates.

## Prerequisites

> **Note:** This extension is a companion tool for rails-openapi-gen. AST analysis cannot determine 100% accurate types, so all response type information must be guaranteed by humans through `# @openapi` comments.

- Rails application with rails-openapi-gen gem installed
- VSCode 1.74.0 or higher

## Features

### 1. Syntax Highlighting
Highlights `# @openapi` comments in Ruby and JBuilder files with clear visual distinction for attributes like type, required, and description.

### 2. Comment Format Linting
- Validates that all `@openapi` comments have the required `type` attribute
- Shows warnings for missing type with red squiggly lines
- `required` and `description` attributes are optional
- Automatically checks on save for `.jbuilder` files

### 3. Field Coverage Detection
- Detects `json.*` fields in JBuilder templates that lack corresponding `@openapi` comments
- Helps prevent CI pipeline failures by catching missing documentation early

### 4. Command Palette Integration
- **OpenAPI: Generate** - Runs `rails openapi:generate`
- **OpenAPI: Check** - Runs `rails openapi:check`
- **OpenAPI: Lint Current File** - Manually triggers linting

### 5. Hover Support
Hover over any `@openapi` comment to see documentation about the required format and attributes.

### 6. Auto-completion and Snippets
- Type `# @op` and press `Ctrl+Space` to get `@openapi` snippets
- After typing `@openapi`, get completion suggestions for:
  - Data types (integer, string, boolean, etc.)
  - Attributes (required:, description:, example:, format:)
  - Boolean values for required field

## Installation

1. Install from VSCode Marketplace: Search for "Rails OpenAPI Gen"
2. Or install manually:
   ```bash
   code --install-extension rails-openapi-gen-vscode-0.0.1.vsix
   ```

## Usage

### Comment Format

```ruby
# Minimal valid format (type only)
# @openapi id:integer
json.id @user.id

# With optional attributes
# @openapi name:string required:true description:"User's full name"
json.name @user.full_name

# @openapi email:string description:"User's email address"
json.email @user.email
```

### Configuration

Configure the extension in VSCode settings:

```json
{
  "railsOpenapiGen.lintOnSave": true,
  "railsOpenapiGen.lintOnChange": false,
  "railsOpenapiGen.generateOnSave": false
}
```

- `lintOnSave`: Enable/disable automatic linting when saving JBuilder files (default: true)
- `lintOnChange`: Enable/disable real-time linting as you type (default: false)
- `generateOnSave`: Automatically run `rails openapi:generate` on save (default: false)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch
```

## Roadmap

- [ ] Partial template support (recursive checking)
- [ ] Quick fixes for missing attributes
- [ ] Snippet support for common patterns
- [ ] Integration with rails-openapi-gen RuboCop plugin

## Contributing

Issues and pull requests are welcome! Please report bugs at [GitHub Issues](https://github.com/myzkey/rails-openapi-gen-vscode/issues).

## License

MIT