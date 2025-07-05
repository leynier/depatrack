# DepaTrack

Lightweight web app to log and track apartment-rental prospects—everything stored locally in your browser. Everything stored locally in your browser for privacy and speed.

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

### Environment Variables

Create a `.env` file at the project root with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
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
