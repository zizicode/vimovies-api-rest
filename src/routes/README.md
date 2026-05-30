# Authentication Routes

## Overview

The authentication system uses hardcoded users with bcrypt passwords and JWT tokens for session management.

## Users

### Hardcoded Users

| ID | Name | Role | Password (plain) |
|----|------|------|------------------|
| usr_001 | Super Admin | super_admin | vimovies123 |
| usr_002 | Admin One | admin | admin123 |
| usr_003 | Admin Two | admin | admin456 |

> **Note**: Passwords are stored as bcrypt hashes in the code. The plain passwords above are for testing purposes.

## API Endpoints

### Public Routes

#### POST /api/auth/admin/login
Login for admin users using password-only authentication.

**Request Body:**
```json
{
  "password": "vimovies123"
}
```

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "usr_001",
      "name": "Super Admin",
      "role": "super_admin"
    }
  }
}
```

### Protected Routes

All protected routes require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

#### GET /api/auth/verify
Verify if the current token is valid.

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "valid": true,
    "user": {
      "id": "usr_001",
      "name": "Super Admin",
      "role": "super_admin"
    }
  }
}
```

#### POST /api/auth/logout
Logout (client should delete the stored token).

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### POST /api/auth/refresh
Refresh the JWT token (extends expiration).

**Response:**
```json
{
  "success": true,
  "status": 200,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Token Configuration

- **Algorithm**: HS256
- **Expiration**: 8 hours
- **Secret**: From `JWT_SECRET` environment variable

## Role Hierarchy

1. `super_admin` (level 2) - Full access
2. `admin` (level 1) - Limited access

## Usage Examples

### Frontend Integration

```typescript
// Login
const login = async (password: string) => {
  const response = await fetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  })
  
  const data = await response.json()
  if (data.success) {
    localStorage.setItem('token', data.data.token)
    return data.data.user
  }
  throw new Error(data.error)
}

// Authenticated request
const fetchAdminData = async () => {
  const token = localStorage.getItem('token')
  const response = await fetch('/api/media/admin', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return response.json()
}
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password": "vimovies123"}'

# Verify token
curl -X GET http://localhost:3000/api/auth/verify \
  -H "Authorization: Bearer <token>"
```

## Security Notes

- JWT tokens are stateless - they cannot be invalidated server-side
- Token expiration is 8 hours - refresh before expiration
- Use HTTPS in production to prevent token interception
- Store tokens securely (httpOnly cookies recommended for production)
