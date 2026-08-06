# API Reference - Highways Management System

## Base URL
```
Development: http://localhost:3000/api
Production:  https://api.yourdomain.com/api
```

## Authentication

All endpoints except `/auth/login` require JWT authentication.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Authentication Endpoints

### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "email": "admin@highways.gov",
      "role": "ADMIN",
      "parentId": null,
      "officeName": "Central Highway Authority",
      "officeCode": "CHA001"
    }
  },
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

## Highways Endpoints

### GET /highways
Get all accessible highways with optional filtering.

**Query Parameters:**
- `divisionId` (number, optional): Filter by division ID
- `subDivisionId` (number, optional): Filter by sub-division ID
- `status` (string, optional): Filter by status (ACTIVE, INACTIVE, UNDER_CONSTRUCTION, CLOSED)
- `search` (string, optional): Search by road name or code

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "roadName": "National Highway 1",
      "roadCode": "NH-1",
      "fromLocation": "Delhi",
      "toLocation": "Amritsar",
      "lengthKm": 456.23,
      "status": "ACTIVE",
      "geometry": {
        "type": "LineString",
        "coordinates": [[77.2090, 28.6139], [77.1025, 29.5816]]
      },
      "divisionName": "North Division",
      "subDivisionName": "North Sub-Division 2",
      "createdByName": "North Division",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### GET /highways/geojson
Get highways in GeoJSON format for map visualization.

**Query Parameters:** Same as GET /highways

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "id": 1,
        "properties": {
          "id": 1,
          "roadName": "National Highway 1",
          "roadCode": "NH-1",
          "fromLocation": "Delhi",
          "toLocation": "Amritsar",
          "lengthKm": 456.23,
          "status": "ACTIVE",
          "divisionName": "North Division",
          "subDivisionName": "North Sub-Division 2"
        },
        "geometry": {
          "type": "LineString",
          "coordinates": [[77.2090, 28.6139], [77.1025, 29.5816]]
        }
      }
    ]
  }
}
```

### GET /highways/:id
Get single highway by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "roadName": "National Highway 1",
    "roadCode": "NH-1",
    "fromLocation": "Delhi",
    "toLocation": "Amritsar",
    "lengthKm": 456.23,
    "status": "ACTIVE",
    "geometry": {
      "type": "LineString",
      "coordinates": [[77.2090, 28.6139], [77.1025, 29.5816]]
    },
    "divisionName": "North Division",
    "subDivisionName": "North Sub-Division 2",
    "createdByName": "North Division",
    "createdByRole": "DIVISION"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Highway not found"
}
```

### POST /highways
Create new highway.

**Required Role:** ADMIN, DIVISION, or SUB_DIVISION

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
      [76.7794, 30.7333],
      [75.8573, 30.9010],
      [74.8723, 31.6340]
    ]
  },
  "divisionId": 2,
  "subDivisionId": 6,
  "status": "ACTIVE"
}
```

**Validation Rules:**
- `roadName`: 2-255 characters
- `roadCode`: 2-100 characters, unique
- `fromLocation`, `toLocation`: 2-255 characters
- `geometry`: Must be LineString with minimum 2 points
- `coordinates`: [longitude, latitude] format, valid ranges
- `status`: ACTIVE, INACTIVE, UNDER_CONSTRUCTION, or CLOSED

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 7,
    "roadName": "National Highway 1",
    "roadCode": "NH-1",
    "fromLocation": "Delhi",
    "toLocation": "Amritsar",
    "lengthKm": 456.23,
    "status": "ACTIVE",
    "geometry": { ... },
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Highway created successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Road code already exists"
}
```

### PUT /highways/:id
Update existing highway.

**Required Role:** ADMIN, DIVISION, or SUB_DIVISION (must have access to the highway)

**Request (partial update):**
```json
{
  "roadName": "National Highway 1 - Updated",
  "status": "UNDER_CONSTRUCTION",
  "geometry": {
    "type": "LineString",
    "coordinates": [...]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "roadName": "National Highway 1 - Updated",
    "roadCode": "NH-1",
    "lengthKm": 456.23,
    "status": "UNDER_CONSTRUCTION",
    "updatedAt": "2024-01-15T11:45:00.000Z"
  },
  "message": "Highway updated successfully"
}
```

### DELETE /highways/:id
Delete highway.

**Required Role:** ADMIN only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Highway deleted successfully"
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Only ADMIN can delete highways"
}
```

### GET /highways/nearby/:id
Get nearby highways within specified distance.

**Query Parameters:**
- `distance` (number, optional): Distance in kilometers (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "roadName": "National Highway 2",
      "roadCode": "NH-2",
      "distanceKm": 5.42,
      "geometry": { ... }
    }
  ]
}
```

---

## Users Endpoints

### GET /users
Get all accessible users.

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive users (default: false)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "email": "admin@highways.gov",
      "role": "ADMIN",
      "parentId": null,
      "officeName": "Central Highway Authority",
      "officeCode": "CHA001",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### GET /users/tree
Get hierarchical user tree.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "name": "System Administrator",
      "role": "ADMIN",
      "parentId": null,
      "officeName": "Central Highway Authority",
      "level": 0,
      "children": [
        {
          "id": 2,
          "username": "div_north",
          "name": "North Division",
          "role": "DIVISION",
          "parentId": 1,
          "level": 1,
          "children": [
            {
              "id": 6,
              "username": "subdiv_n1",
              "name": "North Sub-Division 1",
              "role": "SUB_DIVISION",
              "parentId": 2,
              "level": 2,
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

### GET /users/:id
Get single user by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "username": "div_north",
    "name": "North Division",
    "email": "div.north@highways.gov",
    "role": "DIVISION",
    "parentId": 1,
    "officeName": "Northern Division Office",
    "officeCode": "NDO001",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### POST /users
Create new user.

**Required Role:** ADMIN or DIVISION

**Request:**
```json
{
  "username": "subdiv_n3",
  "password": "SecurePass123!",
  "name": "North Sub-Division 3",
  "email": "subdiv.n3@highways.gov",
  "role": "SUB_DIVISION",
  "parentId": 2,
  "officeName": "North Sub-Division 3",
  "officeCode": "NSD003"
}
```

**Validation Rules:**
- `username`: 3-100 characters, unique
- `password`: Minimum 6 characters
- `name`: 2-255 characters
- `email`: Valid email format, unique
- `role`: DIVISION or SUB_DIVISION (ADMIN cannot be created via API)
- `parentId`: Required for DIVISION and SUB_DIVISION

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "username": "subdiv_n3",
    "name": "North Sub-Division 3",
    "email": "subdiv.n3@highways.gov",
    "role": "SUB_DIVISION",
    "parentId": 2,
    "officeName": "North Sub-Division 3",
    "officeCode": "NSD003",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User created successfully"
}
```

### PUT /users/:id
Update user details.

**Required Role:** ADMIN or DIVISION (must have access to the user)

**Request (partial update):**
```json
{
  "name": "North Sub-Division 3 - Updated",
  "email": "updated@highways.gov",
  "officeName": "Updated Office Name",
  "password": "NewPassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "username": "subdiv_n3",
    "name": "North Sub-Division 3 - Updated",
    "email": "updated@highways.gov",
    "role": "SUB_DIVISION",
    "parentId": 2,
    "officeName": "Updated Office Name",
    "officeCode": "NSD003"
  },
  "message": "User updated successfully"
}
```

### DELETE /users/:id
Delete user.

**Required Role:** ADMIN only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### PUT /users/:id/activate
Activate user account.

**Required Role:** ADMIN or DIVISION

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User activated successfully"
}
```

### PUT /users/:id/deactivate
Deactivate user account.

**Required Role:** ADMIN or DIVISION

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "roadCode",
      "message": "roadCode must be between 2 and 100 characters"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "No token provided"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Required roles: ADMIN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Rate Limiting

- **General API**: 100 requests per minute per IP
- **Login endpoint**: 5 requests per minute per IP
- **Burst limit**: 20 additional requests allowed

When rate limit is exceeded:
```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## Pagination (Future Enhancement)

Not yet implemented. All endpoints return full result sets.
Recommended for production: Add `page` and `limit` parameters.

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Get Highways (with token)
```bash
TOKEN="your_jwt_token_here"

curl -X GET http://localhost:3000/api/highways \
  -H "Authorization: Bearer $TOKEN"
```

### Create Highway
```bash
curl -X POST http://localhost:3000/api/highways \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roadName": "Test Highway",
    "roadCode": "TH-001",
    "fromLocation": "City A",
    "toLocation": "City B",
    "geometry": {
      "type": "LineString",
      "coordinates": [[77.0, 28.0], [77.5, 28.5]]
    },
    "status": "ACTIVE"
  }'
```

---

## WebSocket Support

Not yet implemented. Future enhancement for real-time updates.

---

**Last Updated:** December 2025  
**API Version:** 1.0.0
