# Highways Management System - Project Structure

```
highwaysProject/
│
├── backend/                          # NestJS Backend API
│   ├── src/
│   │   ├── common/                   # Shared resources
│   │   │   ├── decorators/           # Custom decorators
│   │   │   ├── dto/                  # Data Transfer Objects
│   │   │   ├── guards/               # Auth guards
│   │   │   ├── middleware/           # HTTP middleware
│   │   │   ├── services/             # Shared services
│   │   │   └── types/                # TypeScript types
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/                 # Authentication module
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.module.ts
│   │   │   │
│   │   │   ├── users/                # User management
│   │   │   │   ├── users.controller.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── users.module.ts
│   │   │   │
│   │   │   └── highways/             # Highway management
│   │   │       ├── highways.controller.ts
│   │   │       ├── highways.service.ts
│   │   │       └── highways.module.ts
│   │   │
│   │   ├── app.module.ts             # Root module
│   │   └── main.ts                   # Application entry
│   │
│   ├── database/
│   │   ├── schema.sql                # Database schema
│   │   ├── seed.sql                  # Sample data
│   │   └── run-migration.ts          # Migration runner
│   │
│   ├── Dockerfile                    # Backend Docker config
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                          # Environment variables
│
├── frontend/                         # React Frontend SPA
│   ├── src/
│   │   ├── core/                     # Core functionality
│   │   │   ├── api/
│   │   │   │   └── client.ts         # API client
│   │   │   ├── components/
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   └── context/
│   │   │       └── AuthContext.tsx   # Auth state management
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/                 # Login page
│   │   │   ├── dashboard/            # Dashboard
│   │   │   ├── highways/             # Highway CRUD
│   │   │   ├── map/                  # Map view
│   │   │   └── users/                # User management
│   │   │
│   │   ├── types/                    # TypeScript types
│   │   ├── App.tsx                   # Root component
│   │   ├── main.tsx                  # Application entry
│   │   └── index.css                 # Global styles
│   │
│   ├── public/
│   ├── Dockerfile                    # Frontend Docker config
│   ├── nginx.conf                    # Nginx config
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── .env                          # Environment variables
│
├── nginx/                            # Nginx reverse proxy
│   └── nginx.conf                    # Production nginx config
│
├── docker-compose.yml                # Docker orchestration
├── package.json                      # Root package file
├── README.md                         # Documentation
├── setup-dev.sh                      # Development setup script
├── setup-dev.ps1                     # Development setup script (Windows)
├── start.sh                          # Quick start script
├── start.ps1                         # Quick start script (Windows)
├── test-system.sh                    # Quick system tests
├── test-system.ps1                   # Quick system tests (Windows)
├── scripts/                          # Cross-platform runners
│   ├── run-setup.js                   # OS-aware setup launcher
│   └── run-start.js                   # OS-aware start launcher
└── .gitignore

```

## Key Directories Explained

### Backend Structure

- **`common/`**: Shared utilities, guards, decorators, and services
  - `guards/`: Role-based access control guards
  - `services/`: Authorization and audit services
  - `middleware/`: JWT authentication middleware
  - `dto/`: Request/response validation schemas

- **`modules/`**: Feature modules (auth, users, highways)
  - Each module follows NestJS architecture:
    - Controller: HTTP endpoints
    - Service: Business logic
    - Module: Dependency injection configuration

- **`database/`**: SQL migrations and seed data
  - `schema.sql`: Complete database schema with PostGIS
  - `seed.sql`: Sample users and highways data

### Frontend Structure

- **`core/`**: Core functionality and shared components
  - `api/`: Centralized API client with interceptors
  - `components/`: Layout and navigation components
  - `context/`: React Context for global state

- **`modules/`**: Feature-specific components
  - Each module is self-contained with its components and styles
  - Organized by feature (auth, highways, users, map, dashboard)

- **`types/`**: TypeScript type definitions
  - Shared interfaces and enums
  - API response types

## Technology Highlights

### Backend
- **NestJS**: Modular architecture with dependency injection
- **TypeORM**: Database abstraction with PostGIS support
- **Passport JWT**: Stateless authentication
- **Class Validator**: DTO validation
- **Winston**: Structured logging

### Frontend
- **React 18**: Modern React with hooks
- **React Router v6**: Client-side routing
- **Leaflet**: Interactive maps with GeoJSON
- **Axios**: HTTP client with interceptors
- **Vite**: Fast build tool

### Database
- **PostgreSQL 15**: Robust relational database
- **PostGIS 3.3**: Spatial database extension
- **GIST Indexes**: Optimized spatial queries

### DevOps
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy and load balancing
- **Multi-stage builds**: Optimized Docker images
