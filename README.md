# @powerhousedao/diff-analyzer

A powerful diff analysis tool for the Powerhouse ecosystem that provides document model comparison, visualization, and analysis capabilities.

## 🚀 Features

- Document model diff analysis
- GraphQL subgraph integration
- Custom editors for diff visualization
- Tailwind CSS styling support
- React-based UI components
- TypeScript type safety
- Vitest testing framework

## 📦 Installation

```bash
pnpm add @powerhousedao/diff-analyzer
```

## 🛠️ Usage

### Basic Usage

```typescript
import { DiffAnalyzer } from '@powerhousedao/diff-analyzer';

// Initialize the analyzer
const analyzer = new DiffAnalyzer();

// Analyze differences between document models
const diff = await analyzer.analyze(oldModel, newModel);
```

### Using Custom Editors

```typescript
import { DiffEditor } from '@powerhousedao/diff-analyzer/editors';

// Use the built-in diff editor component
<DiffEditor diff={diff} />
```

### Document Models

```typescript
import { DocumentModel } from '@powerhousedao/diff-analyzer/document-models';

// Work with document models
const model = new DocumentModel();
```

## 🏗️ Development

### Available Scripts

- `pnpm build` - Build the package
- `pnpm test` - Run tests
- `pnpm lint` - Run linting
- `pnpm generate` - Generate code
- `pnpm connect` - Connect to services
- `pnpm reactor` - Run reactor
- `pnpm service` - Manage services

### Project Structure

```
diff-analyzer/
├── document-models/  # Document model definitions
├── editors/         # Diff visualization editors
├── processors/      # Diff processing logic
├── subgraphs/       # GraphQL subgraph definitions
├── lib/            # Core library code
└── test/           # Test files
```

## 🧪 Testing

Run the test suite:

```bash
pnpm test
```

For watch mode:

```bash
pnpm test:watch
```

## 📚 Documentation

For more detailed documentation, visit our [documentation site](https://docs.powerhouse.com/diff-analyzer).

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under AGPL-3.0-only - see the [LICENSE](LICENSE) file for details.