---
applyTo: '**'
---

# API Documentation
## Jaothui ID-Trace System

### Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [Response Format](#response-format)
5. [Error Handling](#error-handling)
6. [API Endpoints](#api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [User Management](#user-management)
   - [Farm Management](#farm-management)
   - [Animal Management](#animal-management)
   - [Activity Management](#activity-management)
   - [Notification Management](#notification-management)
7. [Rate Limiting](#rate-limiting)
8. [Security](#security)
9. [Examples](#examples)

### Overview

The Jaothui ID-Trace API provides RESTful endpoints for managing buffalo farm operations, including user authentication, farm management, animal tracking, and activity logging. All endpoints require appropriate authentication and follow RESTful conventions.

### Authentication

#### Authentication Methods
1. **LINE OAuth**: For farm owners
2. **Username/Password**: For farm staff

#### Session Management
- Sessions are managed via HTTP-only secure cookies
- Session tokens include user ID, role, and farm membership information
- Automatic session expiration after 7 days of inactivity

#### Authorization Headers
```http
Authorization: Bearer <session-token>
Cookie: session=<session-id>
```

### Base URL

```
Production: https://jaothui-id-trace.vercel.app/api
Development: http://localhost:3000/api
```

### Response Format

All API responses follow a consistent JSON format:

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response payload
  },
  "message": "Operation completed successfully",
  "timestamp": "2025-11-12T07:30:00.000Z"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "timestamp": "2025-11-12T07:30:00.000Z"
}
```

### Error Handling

#### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resources)
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

#### Error Response Structure
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error context (optional)"
  },
  "requestId": "uuid-for-tracking"
}
```

### API Endpoints

#### Authentication Endpoints

##### POST /auth/line/login
Initiate LINE OAuth login for farm owners.

**Request Body:**
```json
{
  "lineAuthCode": "authorization_code_from_line",
  "redirectUri": "https://yourapp.com/auth/callback"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "lineId": "line_user_id",
      "firstName": "สมชาย",
      "lastName": "ใจดี",
      "avatarUrl": "https://profile.line.com/...",
      "role": "OWNER"
    },
    "farms": [
      {
        "id": "farm-uuid",
        "name": "ฟาร์มของฉัน",
        "province": "นนทบุรี"
      }
    ],
    "sessionToken": "jwt_token"
  }
}
```

##### POST /auth/staff/login
Authenticate farm staff with username and password.

**Request Body:**
```json
{
  "username": "staff_username",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "staff_username",
      "firstName": "มานี",
      "lastName": "รักษา",
      "role": "STAFF"
    },
    "farms": [
      {
        "id": "farm-uuid",
        "name": "ฟาร์มสมศรี",
        "role": "MEMBER"
      }
    ],
    "sessionToken": "jwt_token"
  }
}
```

##### POST /auth/logout
Terminate user session.

**Headers:**
```http
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

##### GET /auth/me
Get current user information and permissions.

**Headers:**
```http
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "staff_username",
      "firstName": "มานี",
      "lastName": "รักษา",
      "role": "STAFF"
    },
    "farms": [
      {
        "id": "farm-uuid",
        "name": "ฟาร์มสมศรี",
        "role": "MEMBER",
        "permissions": ["animal:read", "activity:create", "activity:update"]
      }
    ]
  }
}
```

#### User Management

##### POST /users/staff
Create new staff account (owner only).

**Headers:**
```http
Authorization: Bearer <session-token>
```

**Request Body:**
```json
{
  "farmId": "farm-uuid",
  "username": "new_staff",
  "password": "secure_password",
  "firstName": "สมศรี",
  "lastName": "รักษา",
  "role": "MEMBER"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "new-user-uuid",
      "username": "new_staff",
      "firstName": "สมศรี",
      "lastName": "รักษา",
      "role": "STAFF"
    },
    "membership": {
      "id": "membership-uuid",
      "farmId": "farm-uuid",
      "userId": "new-user-uuid",
      "role": "MEMBER",
      "joinedAt": "2025-11-12T07:30:00.000Z"
    }
  }
}
```

##### GET /users/staff
List staff members for a farm (owner only).

**Query Parameters:**
- `farmId` (string, required): Farm ID
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "staff": [
      {
        "id": "user-uuid",
        "username": "staff_username",
        "firstName": "สมศรี",
        "lastName": "รักษา",
        "role": "STAFF",
        "joinedAt": "2025-11-12T07:30:00.000Z",
        "lastLogin": "2025-11-12T06:45:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### Farm Management

##### GET /farms
Get farms accessible to current user.

**Headers:**
```http
Authorization: Bearer <session-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "farms": [
      {
        "id": "farm-uuid",
        "name": "ฟาร์มของฉัน",
        "province": "นนทบุรี",
        "code": "FARM001",
        "userRole": "OWNER",
        "animalCount": 25,
        "createdAt": "2025-01-15T08:00:00.000Z"
      }
    ]
  }
}
```

##### POST /farms
Create new farm (owner only).

**Request Body:**
```json
{
  "name": "ฟาร์มใหม่",
  "province": "ขอนแก่น",
  "code": "FARM002"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "farm": {
      "id": "new-farm-uuid",
      "name": "ฟาร์มใหม่",
      "province": "ขอนแก่น",
      "code": "FARM002",
      "ownerId": "user-uuid",
      "createdAt": "2025-11-12T07:30:00.000Z"
    },
    "membership": {
      "id": "membership-uuid",
      "farmId": "new-farm-uuid",
      "userId": "user-uuid",
      "role": "OWNER",
      "joinedAt": "2025-11-12T07:30:00.000Z"
    }
  }
}
```

##### GET /farms/{farmId}
Get detailed farm information.

**Path Parameters:**
- `farmId` (string, required): Farm ID

**Response:**
```json
{
  "success": true,
  "data": {
    "farm": {
      "id": "farm-uuid",
      "name": "ฟาร์มของฉัน",
      "province": "นนทบุรี",
      "code": "FARM001",
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-11-10T14:20:00.000Z"
    },
    "stats": {
      "totalAnimals": 25,
      "activeAnimals": 23,
      "transferredAnimals": 1,
      "deceasedAnimals": 1,
      "pendingActivities": 5,
      "overdueActivities": 2
    }
  }
}
```

#### Animal Management

##### GET /animals
List animals with filtering and pagination.

**Query Parameters:**
- `farmId` (string, required): Farm ID
- `status` (string, optional): Filter by status (ACTIVE, TRANSFERRED, DECEASED, ALL)
- `search` (string, optional): Search by tag ID or name
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "animals": [
      {
        "id": "animal-uuid",
        "tagId": "001",
        "name": "นาเดีย",
        "type": "กระบือ",
        "gender": "เมีย",
        "status": "ACTIVE",
        "birthDate": "2562-03-15",
        "color": "ดำ",
        "weightKg": 450.5,
        "heightCm": 145,
        "motherTag": "M001",
        "fatherTag": "F001",
        "imageUrl": "https://storage.supabase.co/...",
        "createdAt": "2025-01-15T08:00:00.000Z",
        "dueActivitiesCount": 2
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 23,
      "totalPages": 2
    }
  }
}
```

##### POST /animals
Create new animal record.

**Request Body (multipart/form-data):**
```
farmId: "farm-uuid"
tagId: "002"
type: "กระบือ"
name: "ทองดี"
gender: "ผู้"
birthDate: "2563-05-20"
color: "น้ำตาล"
weightKg: 520
heightCm: 150
motherTag: "M001"
fatherTag: "F002"
genome: "optional-genome-data"
image: [file] (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "animal": {
      "id": "new-animal-uuid",
      "tagId": "002",
      "name": "ทองดี",
      "type": "กระบือ",
      "gender": "ผู้",
      "status": "ACTIVE",
      "birthDate": "2563-05-20",
      "color": "น้ำตาล",
      "weightKg": 520,
      "heightCm": 150,
      "motherTag": "M001",
      "fatherTag": "F002",
      "genome": null,
      "imageUrl": "https://storage.supabase.co/...",
      "farmId": "farm-uuid",
      "createdAt": "2025-11-12T07:30:00.000Z"
    }
  }
}
```

##### GET /animals/{animalId}
Get detailed animal information.

**Path Parameters:**
- `animalId` (string, required): Animal ID

**Response:**
```json
{
  "success": true,
  "data": {
    "animal": {
      "id": "animal-uuid",
      "tagId": "001",
      "name": "นาเดีย",
      "type": "กระบือ",
      "gender": "เมีย",
      "status": "ACTIVE",
      "birthDate": "2562-03-15",
      "color": "ดำ",
      "weightKg": 450.5,
      "heightCm": 145,
      "motherTag": "M001",
      "fatherTag": "F001",
      "genome": null,
      "imageUrl": "https://storage.supabase.co/...",
      "farmId": "farm-uuid",
      "createdAt": "2025-01-15T08:00:00.000Z",
      "updatedAt": "2025-11-10T14:20:00.000Z"
    },
    "recentActivities": [
      {
        "id": "activity-uuid",
        "title": "ให้อวัคซีน",
        "activityDate": "2568-11-10",
        "status": "COMPLETED",
        "completedBy": "staff-name",
        "completedAt": "2568-11-10T14:30:00.000Z"
      }
    ]
  }
}
```

##### PUT /animals/{animalId}
Update animal information.

**Path Parameters:**
- `animalId` (string, required): Animal ID

**Request Body:**
```json
{
  "name": "นาเดียทองคำ",
  "color": "ดำเข้ม",
  "weightKg": 465,
  "heightCm": 147,
  "motherTag": "M002",
  "fatherTag": "F001",
  "genome": "updated-genome-data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "animal": {
      "id": "animal-uuid",
      "tagId": "001",
      "name": "นาเดียทองคำ",
      "color": "ดำเข้ม",
      "weightKg": 465,
      "heightCm": 147,
      "motherTag": "M002",
      "fatherTag": "F001",
      "genome": "updated-genome-data",
      "updatedAt": "2025-11-12T07:30:00.000Z"
    }
  }
}
```

##### DELETE /animals/{animalId}
Soft delete animal (change status to TRANSFERRED or DECEASED).

**Path Parameters:**
- `animalId` (string, required): Animal ID

**Request Body:**
```json
{
  "status": "TRANSFERRED",
  "reason": "ขายย้ายฟาร์ม"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "animal": {
      "id": "animal-uuid",
      "status": "TRANSFERRED",
      "updatedAt": "2025-11-12T07:30:00.000Z"
    }
  }
}
```

#### Activity Management

##### GET /activities
List activities with filtering.

**Query Parameters:**
- `farmId` (string, required): Farm ID
- `animalId` (string, optional): Filter by specific animal
- `status` (string, optional): Filter by status (PENDING, COMPLETED, CANCELLED, OVERDUE)
- `startDate` (date, optional): Start date range (BE format: 2568-01-01)
- `endDate` (date, optional): End date range (BE format: 2568-12-31)
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "activity-uuid",
        "title": "ให้อนม",
        "description": "นมวัวนมโค 2 ลิตร",
        "activityDate": "2568-11-12",
        "dueDate": "2568-11-12",
        "status": "PENDING",
        "animal": {
          "id": "animal-uuid",
          "tagId": "001",
          "name": "นาเดีย"
        },
        "createdBy": {
          "id": "user-uuid",
          "firstName": "สมศรี",
          "lastName": "รักษา"
        },
        "completedBy": null,
        "completedAt": null,
        "statusReason": null,
        "createdAt": "2025-11-12T07:30:00.000Z",
        "updatedAt": "2025-11-12T07:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

##### POST /activities
Create new activity.

**Request Body:**
```json
{
  "animalId": "animal-uuid",
  "title": "ตรวจสุขภาพ",
  "description": "ตรวจสุขภาพทั่วไป วัดอุณหภูมิ น้ำหนัก",
  "activityDate": "2568-11-15",
  "dueDate": "2568-11-15",
  "status": "PENDING"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "new-activity-uuid",
      "title": "ตรวจสุขภาพ",
      "description": "ตรวจสุขภาพทั่วไป วัดอุณหภูมิ น้ำหนัก",
      "activityDate": "2568-11-15",
      "dueDate": "2568-11-15",
      "status": "PENDING",
      "animalId": "animal-uuid",
      "farmId": "farm-uuid",
      "createdBy": "user-uuid",
      "createdAt": "2025-11-12T07:30:00.000Z"
    }
  }
}
```

##### GET /activities/{activityId}
Get detailed activity information.

**Path Parameters:**
- `activityId` (string, required): Activity ID

**Response:**
```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity-uuid",
      "title": "ให้อนม",
      "description": "นมวัวนมโค 2 ลิตร",
      "activityDate": "2568-11-12",
      "dueDate": "2568-11-12",
      "status": "COMPLETED",
      "statusReason": null,
      "animal": {
        "id": "animal-uuid",
        "tagId": "001",
        "name": "นาเดีย",
        "imageUrl": "https://storage.supabase.co/..."
      },
      "createdBy": {
        "id": "user-uuid",
        "firstName": "สมศรี",
        "lastName": "รักษา"
      },
      "completedBy": {
        "id": "user-uuid",
        "firstName": "มานี",
        "lastName": "รักษา"
      },
      "completedAt": "2025-11-12T14:30:00.000Z",
      "createdAt": "2025-11-12T07:30:00.000Z",
      "updatedAt": "2025-11-12T14:30:00.000Z"
    }
  }
}
```

##### PUT /activities/{activityId}
Update activity status or details.

**Path Parameters:**
- `activityId` (string, required): Activity ID

**Request Body:**
```json
{
  "title": "อัปเดต: ให้อนม",
  "description": "นมวัวนมโค 2.5 ลิตร (เพิ่ม)",
  "activityDate": "2568-11-12",
  "dueDate": "2568-11-13",
  "status": "COMPLETED",
  "statusReason": "ดำเนินการสำเร็จ"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activity": {
      "id": "activity-uuid",
      "title": "อัปเดต: ให้อนม",
      "description": "นมวัวนมโค 2.5 ลิตร (เพิ่ม)",
      "activityDate": "2568-11-12",
      "dueDate": "2568-11-13",
      "status": "COMPLETED",
      "statusReason": "ดำเนินการสำเร็จ",
      "completedBy": "user-uuid",
      "completedAt": "2025-11-12T15:45:00.000Z",
      "updatedAt": "2025-11-12T15:45:00.000Z"
    }
  }
}
```

#### Notification Management

##### GET /notifications/badge
Get notification badge count (due/overdue activities).

**Headers:**
```http
Authorization: Bearer <session-token>
```

**Query Parameters:**
- `farmId` (string, optional): Filter by specific farm

**Response:**
```json
{
  "success": true,
  "data": {
    "badgeCount": 3,
    "breakdown": {
      "due": 2,
      "overdue": 1
    },
    "farmCounts": [
      {
        "farmId": "farm-uuid",
        "farmName": "ฟาร์มของฉัน",
        "count": 2
      }
    ]
  }
}
```

### Rate Limiting

#### Rate Limit Rules
- **Authentication endpoints**: 5 requests per minute per IP
- **General API endpoints**: 100 requests per minute per user
- **File upload endpoints**: 10 requests per minute per user

#### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1636702800
```

#### Rate Limit Exceeded Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

### Security

#### Authentication Security
- All endpoints except `/auth/line/login` and `/auth/staff/login` require authentication
- Session tokens are JWT-based with 7-day expiration
- Passwords are hashed using Argon2 or Bcrypt

#### Data Validation
- All input data is validated using Zod schemas
- SQL injection protection via parameterized queries (Prisma)
- XSS protection with proper output encoding

#### Permission Model
- Zero-trust permission validation on all operations
- Farm membership verification for all farm-related operations
- Role-based access control (OWNER vs. MEMBER permissions)

#### HTTPS Requirements
- All API requests must use HTTPS in production
- HSTS headers enforce secure connections

### Examples

#### JavaScript/TypeScript Example

```typescript
// API Client Setup
const API_BASE_URL = 'https://jaothui-id-trace.vercel.app/api';

class JaothuiAPI {
  private sessionToken: string | null = null;

  setSession(token: string) {
    this.sessionToken = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(this.sessionToken && { Authorization: `Bearer ${this.sessionToken}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  }

  // Staff Login
  async staffLogin(username: string, password: string) {
    return this.request('/auth/staff/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  // Get Animals
  async getAnimals(farmId: string, options: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const params = new URLSearchParams({ farmId, ...options });
    return this.request(`/animals?${params}`);
  }

  // Create Activity
  async createActivity(activityData: {
    animalId: string;
    title: string;
    description?: string;
    activityDate: string;
    dueDate?: string;
    status?: string;
  }) {
    return this.request('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  // Upload Animal Image
  async uploadAnimalImage(animalId: string, file: File) {
    const formData = new FormData();
    formData.append('image', file);

    return this.request(`/animals/${animalId}/image`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }
}

// Usage Example
const api = new JaothuiAPI();

// Login
const loginResult = await api.staffLogin('staff_username', 'password');
api.setSession(loginResult.data.sessionToken);

// Get animals
const animals = await api.getAnimals('farm-uuid', {
  status: 'ACTIVE',
  search: '001',
  page: 1,
  limit: 20
});

// Create activity
const activity = await api.createActivity({
  animalId: 'animal-uuid',
  title: 'ให้อนม',
  description: 'นมวัวนมโค 2 ลิตร',
  activityDate: '2568-11-12',
  dueDate: '2568-11-12',
  status: 'PENDING'
});
```

#### cURL Examples

```bash
# Staff Login
curl -X POST https://jaothui-id-trace.vercel.app/api/auth/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "staff_username",
    "password": "secure_password"
  }'

# Get Animals
curl -X GET "https://jaothui-id-trace.vercel.app/api/animals?farmId=farm-uuid&status=ACTIVE" \
  -H "Authorization: Bearer your-session-token"

# Create Animal
curl -X POST https://jaothui-id-trace.vercel.app/api/animals \
  -H "Authorization: Bearer your-session-token" \
  -H "Content-Type: application/json" \
  -d '{
    "farmId": "farm-uuid",
    "tagId": "003",
    "type": "กระบือ",
    "name": "สมศรี",
    "gender": "เมีย",
    "birthDate": "2564-06-15",
    "color": "น้ำตาล"
  }'

# Upload Animal Image
curl -X POST https://jaothui-id-trace.vercel.app/api/animals/animal-uuid/image \
  -H "Authorization: Bearer your-session-token" \
  -F "image=@/path/to/buffalo-photo.jpg"

# Complete Activity
curl -X PUT https://jaothui-id-trace.vercel.app/api/activities/activity-uuid \
  -H "Authorization: Bearer your-session-token" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "statusReason": "ดำเนินการสำเร็จ"
  }'
```

---

**Document Version**: 1.0
**Last Updated**: November 12, 2025
**API Version**: v1