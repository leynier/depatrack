# DepaTrack

A modern property management application built with Vue 3, TypeScript, and TailwindCSS for tracking rental prospects and managing property listings.

## Features

### Property Management (CRUD)

- **Create**: Add new properties with comprehensive details
- **Read**: View properties in table or card format
- **Update**: Edit existing properties with pre-populated forms
- **Delete**: Remove properties with confirmation dialogs

### Property Data Fields

- **Zone**: Location/area description
- **Price**: Monthly rent in Mexican pesos (MXN)
- **Status**: Six predefined statuses (Available, In Process, Occupied, Documents Pending, Requires Guarantees, Not Available)
- **Requirements**: Rental conditions and requirements
- **Comments**: Additional notes and observations
- **Property Link**: Direct URL to property listing
- **WhatsApp**: Contact link for direct communication

### Search and Filtering

- **Multi-term Search**: Search across zone, price, requirements, and comments
- **Price Range**: Filter by minimum and maximum price
- **Status Filter**: Filter by multiple property statuses
- **Active Filter Indicators**: Visual representation of applied filters
- **Individual Filter Removal**: Remove specific filters without clearing all
- **Clear All**: Reset all filters and search terms

### Data Import/Export

- **CSV Export**: Download filtered or complete property data
- **CSV Import**: Upload property data from CSV files
- **Date-stamped Files**: Exported files include timestamp
- **Data Validation**: Import validation with error handling
- **Character Encoding**: Proper handling of special characters

### User Interface

- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Dual View Modes**: Switch between table and card layouts
- **Modal Forms**: Elegant forms for creating/editing properties
- **Status Indicators**: Color-coded status badges
- **Interactive Elements**: Hover effects and click actions
- **Currency Formatting**: Automatic Mexican peso formatting

### Data Persistence

- **Local Storage**: All data stored in browser's local storage
- **Auto-save**: Automatic saving after each change
- **Data Migration**: Automatic data format updates
- **Offline Operation**: No internet connection required

## Tech Stack

- **Framework**: Vue 3 with Composition API
- **Language**: TypeScript with strict typing
- **Styling**: TailwindCSS
- **Icons**: Heroicons
- **UI Components**: Headless UI for Vue
- **State Management**: Pinia
- **Build Tool**: Vite
- **Package Manager**: Bun

## Development Setup

### Prerequisites

- Node.js (18+)
- Bun package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd depatrack

# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Run type checking
bun run type-check
```

### Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run preview` - Preview production build
- `bun run type-check` - Run TypeScript type checking
- `bun run ruler` - Apply AI coding assistant rules

## Usage Guide

### Adding Properties

1. Click "Add Property" button
2. Fill in required fields (Zone and Price)
3. Select appropriate status
4. Add optional requirements, comments, and links
5. Click "Add Property" to save

### Searching and Filtering

1. Use the search bar for text-based searches
2. Click "Filters" to access advanced filtering options
3. Set price ranges and select specific statuses
4. View active filters below the search bar
5. Remove individual filters or clear all at once

### Managing Data

1. **Export**: Click "Import/Export" → "Export to CSV"
2. **Import**: Click "Import/Export" → "Import from CSV"
3. **Edit**: Click the pencil icon on any property
4. **Delete**: Click the trash icon (requires confirmation)

### Viewing Properties

- **Table View**: Complete property information in tabular format
- **Card View**: Visual cards with detailed property information
- **External Links**: Click link icons to open property URLs
- **WhatsApp**: Click WhatsApp icons for direct contact

## Data Structure

### Property Fields

```typescript
interface Property {
  id: string;
  zone: string;
  price: number;
  status: PropertyStatus;
  requirements?: string;
  comments?: string;
  link?: string;
  whatsapp?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Status Options

- `available` - Available for rent
- `in_process` - Application in progress
- `occupied` - Currently rented
- `documents_pending` - Waiting for documentation
- `requires_guarantees` - Guarantees needed
- `not_available` - Not available for rent

## CSV Format

When importing/exporting data, the CSV format includes:

- ID, Zone, Price, Status, Requirements, Comments, Link, WhatsApp, Created At, Updated At

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## Development Rules

This project uses [Ruler](https://github.com/intellectronica/ruler) for centralized AI coding assistant instructions. The development rules are located in the `.ruler/` directory and cover:

- Vue 3 + TypeScript patterns and best practices
- Tailwind CSS and UI component guidelines  
- Pinia state management patterns
- Performance optimization and accessibility standards
- Git workflow and code quality standards

### Applying Rules

```bash
# Apply rules to all AI assistants
bun run ruler

# Apply to specific agents only (using local install)
bunx ruler apply --agents cursor,claude

# Apply with verbose output
bunx ruler apply --verbose
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Apply development rules: `bun run ruler`
4. Commit changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License.
