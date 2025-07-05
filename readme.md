# DepaTrack

Lightweight web app to log and track apartment-rental prospects with local-first architecture and offline support. Data is stored locally in your browser for speed and privacy, with optional cloud synchronization when signed in.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (JavaScript runtime and package manager)

### Installation

```bash
# Clone the repository
git clone https://github.com/leynier/depatrack
cd depatrack

# Install dependencies
bun install

# Start development server
bun run dev
```

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run type-check` - Run TypeScript type checking
- `bun run ruler` - Apply AI coding assistant rules

## Tech Stack

- Vue 3 + TypeScript + Vite
- TailwindCSS + shadcn-vue
- Pinia for state management
