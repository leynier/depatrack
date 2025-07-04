# Development Workflow and Standards

## Git Commit Conventions

Follow Conventional Commits specification for consistent commit messages.

### Format

```txt
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user  
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **ci**: CI/CD configuration changes

### Examples

```bash
feat(properties): add appointment date field to property form
fix(theme): resolve dark mode flash on page load
docs(readme): update installation instructions
refactor(utils): extract common date formatting logic
perf(table): implement virtual scrolling for large datasets
```

### Scopes

Use these scopes for DepaTrack:

- `properties` - Property-related features
- `theme` - Dark/light theme functionality
- `ui` - UI components and styling
- `store` - Pinia store changes
- `utils` - Utility functions
- `build` - Build configuration
- `deploy` - Deployment settings

## Code Quality Standards

### TypeScript

- **Strict mode enabled** - no `any` types allowed
- **Explicit return types** for all functions
- **Interface definitions** for all data structures
- **Proper error handling** with specific exception types

### Vue Components

- **Single File Components** with `<script setup lang="ts">`
- **Props validation** with TypeScript interfaces
- **Emit declarations** with typed event signatures
- **Proper lifecycle management** with cleanup in `onUnmounted`

### Testing Strategy

- **Unit tests** for utility functions and composables
- **Component tests** for critical user interactions
- **Integration tests** for complete user workflows
- **Accessibility tests** with axe-core or similar tools

## Development Commands

```bash
# Apply AI coding assistant rules
bun run ruler

# Development server
bun run dev

# Production build
bun run build

# Type checking
bun run type-check

# Linting (if configured)
bun run lint

# Testing (if configured)
bun run test
```

## Code Review Guidelines

### Before Submitting PR

- [ ] All TypeScript errors resolved
- [ ] Code follows established patterns
- [ ] Components tested in both light and dark themes
- [ ] Mobile responsiveness verified
- [ ] Accessibility considerations addressed
- [ ] Performance impact considered

### Review Checklist

- [ ] Code follows project conventions
- [ ] TypeScript types are properly defined
- [ ] No accessibility regressions
- [ ] Performance implications considered
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional format

## Deployment Process

1. **Push to main branch** triggers automatic GitHub Actions workflow
2. **Build process** runs `bun run build` with type checking
3. **Deployment** to GitHub Pages at depatrack.leynier.dev
4. **Domain configuration** handled via CNAME file

The deployment is fully automated and requires no manual intervention.
