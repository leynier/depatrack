# DepaTrack Project Overview

DepaTrack is a lightweight property tracking web application that helps users log and track apartment rental prospects. It follows a local-first architecture with offline support, storing data locally in the browser for speed and privacy, with optional cloud synchronization when signed in.

## Tech Stack

- **Frontend**: Vue 3 with Composition API and TypeScript
- **Styling**: Tailwind CSS + shadcn-vue components  
- **Build Tool**: Vite
- **Package Manager**: Bun
- **State Management**: Pinia
- **Icons**: Heroicons
- **Deployment**: GitHub Pages at depatrack.com

## Architecture

- **Single Page Application** with Vue Router
- **Component-based architecture** with reusable UI components
- **Reactive state management** with Pinia stores
- **Local-first data architecture** with localStorage for offline access and Firebase for cloud synchronization
- **Mobile-first responsive design** with dark/light theme support

## Core Features

- Property CRUD operations (Create, Read, Update, Delete)
- Advanced filtering and search functionality
- CSV import/export capabilities
- Appointment scheduling with date/time fields
- Mobile-responsive design with floating action buttons
- Dark/light theme toggle with system preference detection
- Optional cloud synchronization with Google authentication
- Offline-first functionality with local data persistence

## Project Structure

```txt
src/
├── components/          # Vue components
│   ├── ui/             # shadcn-vue components
│   └── *.vue           # App-specific components
├── composables/        # Vue composables (e.g., useTheme)
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions (CSV, currency, etc.)
├── views/              # Page-level components
├── router/             # Vue Router configuration
└── assets/             # Static assets and CSS
```
