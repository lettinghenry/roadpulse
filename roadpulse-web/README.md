# RoadPulse Web - Map Visualization

Interactive web application for visualizing road surface anomalies detected by the RoadPulse mobile application.

## Features

- Interactive map interface for exploring road conditions
- Real-time visualization of road anomaly data
- Severity-based color coding and clustering
- Responsive design for mobile and desktop
- Accessibility-compliant interface
- Property-based testing for correctness validation

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Mapping Library**: Leaflet with React-Leaflet
- **Clustering**: SuperCluster for efficient marker clustering
- **Testing**: Vitest with React Testing Library
- **Property-Based Testing**: fast-check
- **Code Quality**: ESLint + Prettier
- **Styling**: CSS with responsive design

## Getting Started

### Prerequisites

- Node.js (v20.14.0 or higher)
- npm (v10.7.0 or higher)

### Installation

1. Clone the repository
2. Navigate to the roadpulse-web directory
3. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building

Build for production:
```bash
npm run build
```

### Testing

Run all tests:
```bash
npm run test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Code Quality

Run ESLint:
```bash
npm run lint
```

Format code with Prettier:
```bash
npx prettier --write src/
```

## Project Structure

```
src/
├── components/          # React components
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── test/               # Test utilities and setup
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Core Dependencies

- **react**: ^18.2.0 - React framework
- **react-dom**: ^18.2.0 - React DOM rendering
- **leaflet**: ^1.9.4 - Interactive maps
- **react-leaflet**: ^4.2.1 - React integration for Leaflet
- **supercluster**: ^8.0.1 - Fast marker clustering

## Development Dependencies

- **typescript**: ^5.2.2 - TypeScript compiler
- **vite**: ^5.2.0 - Build tool and dev server
- **vitest**: ^1.4.0 - Testing framework
- **@testing-library/react**: ^14.2.1 - React testing utilities
- **fast-check**: ^3.17.1 - Property-based testing
- **eslint**: ^8.57.0 - Code linting
- **prettier**: ^3.2.5 - Code formatting

## Requirements Addressed

This setup addresses the following requirements from the specification:

- **Requirement 1.1**: Interactive map display with React and Leaflet
- **Requirement 1.2**: Support for pan, zoom, and rotation operations
- **Performance**: Vite for fast development and optimized builds
- **Testing**: Comprehensive testing setup with unit and property-based tests
- **Code Quality**: ESLint and Prettier for consistent code standards
- **TypeScript**: Strong typing for better development experience

## Next Steps

The project structure is now ready for implementing the map visualization features according to the task list in `.kiro/specs/map-visualization/tasks.md`.