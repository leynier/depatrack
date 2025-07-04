# DepaTrack Project Overview

DepaTrack is a lightweight property tracking web application that helps users log and track apartment rental prospects. All data is stored locally in the browser for privacy and speed.

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
- **Local data persistence** using browser localStorage
- **Mobile-first responsive design** with dark/light theme support

## Core Features

- Property CRUD operations (Create, Read, Update, Delete)
- Advanced filtering and search functionality
- CSV import/export capabilities
- Appointment scheduling with date/time fields
- Mobile-responsive design with floating action buttons
- Dark/light theme toggle with system preference detection

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
