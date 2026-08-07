# Highways Management System

A comprehensive web-based Single Page Application (SPA) for managing highways and road segments with geo-location and hierarchical role-based access control.

## 🎯 Features

### Core Capabilities

- **Centralized Highway Data Repository**: Single source of truth for all highway and road segment data
- **PostGIS Integration**: Accurate geo-spatial storage with latitude, longitude, and polyline representation
- **Hierarchical RBAC**: Three-tier role structure (ADMIN → DIVISION → SUB_DIVISION)
- **Interactive Map View**: Leaflet-based map visualization with polyline drawing
- **Audit Logging**: Complete tracking of all CRUD operations with timestamps
- **Real-time Data**: Fast SPA architecture with no page reloads
- **Secure Authentication**: JWT-based authentication with token refresh

### Role-Based Access Control

#### ADMIN (Central Office)
- Full CRUD control over all data
- Can create/manage DIVISION users
- View nationwide highway coverage
- Delete any record

#### DIVISION (Division Offices)
- Manage own highways and sub-division highways
- Create/manage SUB_DIVISION users
- View division-wide data
- Cannot delete records

#### SUB_DIVISION (Sub-Division Offices)
- Manage only own highways
- View only assigned data
- Limited to own office scope

## 🏗️ Architecture

### Technology Stack

**Backend:**
- Node.js + NestJS
- TypeScript
- PostgreSQL 15 + PostGIS 3.3
- JWT Authentication
- bcrypt for password hashing

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- React Router v6
- Leaflet (Maps)
- Axios (API client)
- Zustand (State management)
- React Toastify (Notifications)

**Deployment:**
- Docker & Docker Compose
- Nginx (Reverse proxy)
- Production-ready containerization

### Architecture Diagram

```
┌─────────────────┐
│   Browser       │
│   (React SPA)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Nginx Gateway  │
│  Rate Limiting  │
└────────┬────────┘
         │ JWT Auth
         ▼
┌─────────────────┐
│  NestJS API     │
│  RBAC + Audit   │
└────────┬────────┘
         │ SQL + PostGIS
┌─────────────────┐
│  PostgreSQL     │
│  + PostGIS      │
└─────────────────┘
```

## 📦 Installation

### Prerequisites

- Node.js >= 18.x
- PostgreSQL 15 with PostGIS extension
- Docker & Docker Compose (for containerized deployment)

### Quick Start (Development)
#### 1. Clone Repository

```bash
cd <project-root>
```

PowerShell (Windows):
```powershell
cd C:\Projects\highwaysProject
```

#### 2. Setup Database

```bash
# Start PostgreSQL with PostGIS
docker run -d \
  --name highways_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=highways_db \
  -p 5432:5432 \
  postgis/postgis:15-3.3

# Wait for PostgreSQL to be ready (10 seconds)
sleep 10
```

PowerShell (Windows):
```powershell
docker run -d `
  --name highways_postgres `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=highways_db `
  -p 5432:5432 `
  postgis/postgis:15-3.3

Start-Sleep -Seconds 10
```

#### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations and seed data
npm run migration:run

# Start development server
npm run dev
```

PowerShell (Windows):
```powershell
Copy-Item .env.example .env
```

Backend will run on `http://localhost:3000`

#### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

PowerShell (Windows):
```powershell
Copy-Item .env.example .env
```

Frontend will run on `http://localhost:3001`

### Docker Deployment (Production)

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

PowerShell (Windows):
```powershell
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

Services:
- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`
- PostgreSQL: `localhost:5432`
- Nginx (optional): `http://localhost:80`

## 🔐 Default Credentials

### Admin User
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: ADMIN
- **Office**: Central Highway Authority

### Division Users
- **Username**: `div_north` / `div_south` / `div_east` / `div_west`
- **Password**: `admin123`
- **Role**: DIVISION

### Sub-Division Users
- **Username**: `subdiv_n1` / `subdiv_s1` / `subdiv_e1`
- **Password**: `admin123`
- **Role**: SUB_DIVISION

⚠️ **Change these passwords in production!**

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

#### POST /auth/login
Login and receive JWT token

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "role": "ADMIN",
      "email": "admin@highways.gov"
    }
  }
}
```

### Highways Endpoints

#### GET /highways
Get all accessible highways with filtering

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `divisionId` (optional): Filter by division
- `subDivisionId` (optional): Filter by sub-division
- `status` (optional): Filter by status (ACTIVE, INACTIVE, etc.)
- `search` (optional): Search by road name or code

#### POST /highways
Create new highway

**Request:**
```json
{
  "roadName": "National Highway 1",
  "roadCode": "NH-1",
  "fromLocation": "Delhi",
  "toLocation": "Amritsar",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [77.2090, 28.6139],
      [77.1025, 29.5816],
      [76.7794, 30.7333]
    ]
  },
  "divisionId": 2,
  "subDivisionId": 6,
  "status": "ACTIVE"
}
```

#### PUT /highways/:id
Update highway details

#### DELETE /highways/:id
Delete highway (ADMIN only)

#### GET /highways/geojson
Get highways in GeoJSON format for map visualization

### Users Endpoints

#### GET /users
Get all accessible users

#### GET /users/tree
Get hierarchical user tree

#### POST /users
Create new user (ADMIN/DIVISION only)

#### PUT /users/:id
Update user details

#### DELETE /users/:id
Delete user (ADMIN only)

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL,
    parent_id INTEGER REFERENCES users(id),
    office_name VARCHAR(255),
    office_code VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Highways Table
```sql
CREATE TABLE highways (
    id SERIAL PRIMARY KEY,
    road_name VARCHAR(255) NOT NULL,
    road_code VARCHAR(100) UNIQUE NOT NULL,
    from_location VARCHAR(255) NOT NULL,
    to_location VARCHAR(255) NOT NULL,
    geom GEOMETRY(LINESTRING, 4326) NOT NULL,
    length_km DECIMAL(10, 3),
    division_id INTEGER REFERENCES users(id),
    sub_division_id INTEGER REFERENCES users(id),
    status highway_status DEFAULT 'ACTIVE',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🛡️ Security Features

- **JWT Authentication**: Stateless token-based auth
- **Password Hashing**: bcrypt with 10 rounds
- **CORS Protection**: Configured allowed origins
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API request throttling
- **Input Validation**: Class-validator DTOs
- **HTTPS Ready**: SSL/TLS support
- **Audit Trail**: Complete operation logging

## 📊 Performance Optimizations

- **Spatial Indexing**: GIST indexes on geometry columns
- **Database Indexes**: Optimized for frequent queries
- **Connection Pooling**: PostgreSQL connection management
- **Lazy Loading**: Maps load data on demand
- **Code Splitting**: React route-based splitting
- **Compression**: Gzip enabled on nginx

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📖 Development Guide

### Adding New Highway

1. Navigate to **Highways** → **Add Highway**
2. Fill in road details
3. Draw route on map by clicking points
4. Assign to Division/Sub-Division
5. Set status and save

### Managing Users

1. Navigate to **Users** (ADMIN/DIVISION only)
2. Click **Add User**
3. Select appropriate role
4. Assign parent (for hierarchy)
5. Set office details and save

### Viewing Audit Logs

Audit logs are automatically created for all operations:
- User login
- Highway create/update/delete
- User create/update/delete

Query audit logs via API:
```bash
GET /api/audit-logs?userId=1&entityType=HIGHWAY
```

## 🚀 Production Deployment

### Environment Variables

**Backend (.env):**
```env
NODE_ENV=production
PORT=3000
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=<strong-password>
DB_NAME=highways_db
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRATION=24h
CORS_ORIGIN=https://yourdomain.com
```

**Frontend (.env):**
```env
VITE_API_URL=https://api.yourdomain.com
```

### Docker Production Build

```bash
# Build images
docker-compose build

# Start with Nginx
docker-compose --profile production up -d

# Check health
docker-compose ps
```

PowerShell (Windows):
```powershell
docker compose build
docker compose --profile production up -d
docker compose ps
```

### SSL/TLS Configuration

1. Obtain SSL certificates (Let's Encrypt recommended)
2. Place certificates in `nginx/ssl/`
3. Uncomment HTTPS configuration in `nginx/nginx.conf`
4. Update CORS settings in backend

## 📈 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3000/api/health

# Database connection
docker-compose exec postgres pg_isready
```

PowerShell (Windows):
```powershell
docker compose exec postgres pg_isready -U postgres
```

### Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

PowerShell (Windows):
```powershell
docker compose logs -f
docker compose logs -f backend
```

## 🔧 Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL status
docker-compose exec postgres psql -U postgres -c "SELECT version();"

# Check PostGIS extension
docker-compose exec postgres psql -U postgres -d highways_db -c "SELECT PostGIS_version();"
```

PowerShell (Windows):
```powershell
docker compose exec postgres psql -U postgres -c "SELECT version();"
docker compose exec postgres psql -U postgres -d highways_db -c "SELECT PostGIS_version();"
```

### CORS Errors

Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL:
```env
CORS_ORIGIN=http://localhost:3001
```

### JWT Token Expired

Tokens expire after 24 hours. User will be automatically logged out and redirected to login.

## 📄 License

This project is proprietary software for government highway management.

## 👥 Contributors

- System Administrator
- Development Team
- Highway Authority

## 📞 Support

For issues or questions:
- Create an issue in the repository
- Contact: admin@highways.gov

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Status**: Production Ready ✅
