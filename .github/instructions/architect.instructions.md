---
applyTo: '**'
---

# System Architecture Documentation
## Jaothui ID-Trace System

### Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [System Components](#system-components)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Security Architecture](#security-architecture)
6. [Performance Architecture](#performance-architecture)
7. [Deployment Architecture](#deployment-architecture)
8. [Scalability Design](#scalability-design)
9. [Monitoring & Observability](#monitoring--observability)
10. [Development Workflow](#development-workflow)
11. [Infrastructure Components](#infrastructure-components)

### Architecture Overview

The Jaothui ID-Trace system follows a modern, cloud-native architecture designed for scalability, security, and maintainability. The system is built as a full-stack web application with clear separation between frontend, backend, and data layers.

#### Core Architecture Principles
1. **Mobile-First Design**: Optimized for mobile devices with progressive enhancement
2. **Zero-Trust Security**: Every operation requires authentication and authorization
3. **Microservice-Ready**: Modular design for future microservice migration
4. **API-First Design**: RESTful APIs with comprehensive documentation
5. **Data Privacy First**: Privacy-by-design with proper data isolation

#### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Mobile Web App (React/Next.js)                              │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   Browser UI    │  │   Components    │                     │
│  │   (shadcn-ui)   │  │   (recharts)    │                     │
│  │   (Tailwind)    │  │   (lucide)      │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Next.js 14 (App Router)                                     │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   API Routes    │  │   Middleware    │                     │
│  │   (Auth)        │  │   (RLS)          │                     │
│  │   (Validation)  │  │   (Rate Limit)   │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Supabase Services                                           │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   PostgreSQL    │  │   Auth Service  │                     │
│  │   (Prisma ORM)   │  │   (better-auth) │                     │
│  │   (RLS Policies) │  │   (LINE OAuth)   │                     │
│  └─────────────────┘  └─────────────────┘                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   File Storage  │  │   Real-time     │                     │
│  │   (Supabase)    │  │   (Postgres)    │                     │
│  │   (Images)      │  │   (Future)       │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend Stack
```
Framework: Next.js 14.x (App Router)
UI Library: shadcn-ui + Tailwind CSS v4
Language: TypeScript
State Management: React Hooks + React Query
Forms: react-hook-form + zod
Icons: Lucide React
Charts: recharts (future)
Testing: Jest + @testing-library/react
```

#### Backend Stack
```
Runtime: Rust (Axum or Actix-web)
API: Rust HTTP framework endpoints (Axum/Actix)
Authentication: environment-based session/auth libraries or OAuth integrations
Database: PostgreSQL 15+
ORM/DB: sqlx or Diesel (async SQL / query builder)
Validation: serde + validator or custom zod-like validation in Rust
File Storage: Supabase Storage or S3-compatible storage
Real-time: Postgres listen/notify or WebSocket (depending on service)
```

#### Infrastructure Stack
```
Platform: Vercel (Next.js optimized)
Database: Supabase (PostgreSQL)
Storage: Supabase Storage
CDN: Vercel Edge Network
DNS: Vercel DNS
Monitoring: Vercel Analytics
Error Tracking: Built-in error reporting
```

### System Components

#### 1. Frontend Application Layer

**Next.js 14 App Router Structure**
```
app/
├── (auth)/                    # Authentication routes group
│   ├── login/               # Login page
│   └── callback/            # OAuth callback
├── api/                      # API routes
│   ├── auth/               # Authentication endpoints
│   ├── users/              # User management
│   ├── farms/              # Farm management
│   ├── animals/            # Animal management
│   ├── activities/         # Activity management
│   └── notifications/      # Notification endpoints
├── farms/                   # Farm-specific pages
│   ├── [farmId]/          # Dynamic farm routes
│   └── create/            # Create new farm
├── animals/                 # Animal management pages
│   ├── [animalId]/       # Animal detail pages
│   ├── create/           # Create new animal
│   └── list/             # Animal listing
├── profile/                 # User profile pages
├── globals.css             # Global styles
├── layout.tsx              # Root layout
└── page.tsx                # Home page
```

**Component Architecture**
```typescript
// Component hierarchy
src/
├── components/
│   ├── ui/                  # shadcn-ui components
│   │   ├── button.tsx
│   │   ├── form.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/              # Layout components
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── features/           # Feature-specific components
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   └── line-login.tsx
│   │   ├── animals/
│   │   │   ├── animal-card.tsx
│   │   │   ├── animal-list.tsx
│   │   │   └── animal-detail.tsx
│   │   └── activities/
│   │       ├── activity-form.tsx
│   │       └── activity-timeline.tsx
│   └── providers/           # Context providers
│       ├── auth-provider.tsx
│       └── theme-provider.tsx
├── lib/                    # Utility libraries
│   ├── auth.ts             # Authentication utilities
│   ├── db.ts               # Database client
│   ├── validations.ts      # Zod schemas
│   └── utils.ts            # Helper functions
├── hooks/                  # Custom React hooks
│   ├── use-auth.ts
│   ├── use-farm.ts
│   └── use-activities.ts
└── types/                  # TypeScript type definitions
    ├── auth.ts
    ├── database.ts
    └── api.ts
```

#### 2. API Layer

**Authentication Middleware**
```typescript
// middleware.ts
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Protect API routes
  if (nextUrl.pathname.startsWith("/api/") && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn && nextUrl.pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    "/api/:path*",
  ],
}
```

**API Route Structure**
```typescript
// api/animals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { requireFarmMembership } from "@/lib/permissions"
import { animalSchema } from "@/lib/validations"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const animal = await db.animal.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            createdBy: { select: { firstName: true, lastName: true } },
            completedBy: { select: { firstName: true, lastName: true } }
          }
        }
      }
    })

    if (!animal) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Animal not found" } },
        { status: 404 }
      )
    }

    // Verify user has access to this animal's farm
    await requireFarmMembership(request, animal.farmId)

    return NextResponse.json({
      success: true,
      data: { animal }
    })
  } catch (error) {
    console.error("Animal fetch error:", error)
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch animal" } },
      { status: 500 }
    )
  }
}
```

#### 3. Database Layer

**Prisma Schema Configuration**
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Model definitions (see DATABASE.md for full schema)
model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lineId       String?   @unique @map("line_id")
  username     String?   @unique
  passwordHash String?   @map("password_hash")
  // ... other fields
  @@map("users")
}
```

**Database Client Configuration**
```typescript
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}

// Helper for transactions
export async function dbTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return db.$transaction(callback)
}
```

### Data Flow Architecture

#### 1. Authentication Flow
```
User Request → Frontend → LINE OAuth/Username → API → better-auth →
JWT Token → Frontend → Secure Cookie → Auth Middleware → Protected Route
```

**Authentication Flow Details**
```mermaid
sequenceDiagram
    participant User as U
    participant Frontend as F
    participant API as A
    participant LINE as L
    participant DB as D

    U->>F: Click "Login with LINE"
    F->>L: OAuth Redirect
    L->>F: Authorization Code
    F->>A: POST /auth/line/login
    A->>L: Exchange Code for Token
    L->>A: Access Token + User Info
    A->>D: Find/Create User
    A->>A: Create JWT Session
    A->>F: Session Token + User Data
    F->>U: Redirect to Profile
```

#### 2. Data Access Flow
```
User Action → Frontend Component → API Request →
Auth Middleware → Permission Check → Database Query →
RLS Policy Enforcement → Response → Frontend Update
```

**Data Access Pattern**
```typescript
// Secure data access pattern
export async function getAnimal(animalId: string, request: Request) {
  // 1. Authentication (handled by middleware)
  const session = await auth()

  // 2. Authorization
  const animal = await db.animal.findUnique({ where: { id: animalId } })
  if (!animal) throw new Error("Animal not found")

  await requireFarmMembership(request, animal.farmId)

  // 3. Data Query (RLS automatically filters by farm membership)
  return db.animal.findUnique({
    where: { id: animalId },
    include: { activities: true }
  })
}
```

#### 3. File Upload Flow
```
User Selection → Frontend File Input →
Client Validation → Upload to Supabase Storage →
Database Update with Image URL → Frontend Display Update
```

**File Upload Implementation**
```typescript
// Upload animal image
export async function uploadAnimalImage(animalId: string, file: File) {
  // 1. Validate permissions
  const animal = await db.animal.findUnique({ where: { id: animalId } })
  await requireFarmMembership(request, animal.farmId)

  // 2. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${animalId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('animal-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // 3. Update animal record
  const imageUrl = data.publicUrl
  await db.animal.update({
    where: { id: animalId },
    data: { imageUrl }
  })

  return imageUrl
}
```

### Security Architecture

#### 1. Authentication Security

**better-auth Configuration**
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { LINE } from "better-auth/providers/line"

export const { auth, signIn, signOut } = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  providers: [
    {
      id: "line",
      name: "LINE",
      type: "oidc",
      issuer: "https://access.line.me",
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
      wellKnown: "https://access.line.me/.well-known/openid_configuration",
    },
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // Custom sign-in logic
      return true
    },
    async session({ session, user }) {
      // Customize session data
      return {
        ...session,
        user: {
          ...session.user,
          role: user.role,
        },
      }
    },
  },
})
```

#### 2. Authorization Security

**Row Level Security (RLS)**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_members ENABLE ROW LEVEL SECURITY;

-- Policy for animal table
CREATE POLICY "farm_members_can_manage_animals" ON animals
    FOR ALL
    USING (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );
```

#### 3. Input Validation Security

**Zod Validation Schemas**
```typescript
// lib/validations.ts
import { z } from 'zod'

export const animalSchema = z.object({
  farmId: z.string().uuid(),
  tagId: z.string().min(1).max(50),
  name: z.string().min(1).max(255).optional(),
  type: z.enum(['WATER_BUFFALO', 'SWAMP_BUFFALO', 'CATTLE', 'GOAT', 'PIG', 'CHICKEN']),
  gender: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('FEMALE'),
  status: z.enum(['ACTIVE', 'TRANSFERRED', 'DECEASED', 'SOLD']).default('ACTIVE'),
  birthDate: z.string().datetime().optional(),
  color: z.string().max(255).optional(),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  motherTag: z.string().max(50).optional(),
  fatherTag: z.string().max(50).optional(),
  genome: z.string().optional(),
})

export const activitySchema = z.object({
  farmId: z.string().uuid(),
  animalId: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  activityDate: z.string().datetime(),
  dueDate: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE']).default('PENDING'),
})
```

#### 4. API Security

**Rate Limiting Implementation**
```typescript
// lib/rate-limit.ts
import { RateLimit } from "unlimited-api"

// Different limits for different endpoints
const authLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

const apiLimiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/auth/")) {
    return authLimiter(request)
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return apiLimiter(request)
  }
}
```

### Performance Architecture

#### 1. Frontend Performance

**Code Splitting Strategy**
```typescript
// Dynamic imports for route-based code splitting
import dynamic from 'next/dynamic'

const AnimalDetail = dynamic(() => import('@/components/features/animals/animal-detail'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
})

// Lazy loading for heavy components
const ActivityTimeline = lazy(() => import('@/components/features/activities/activity-timeline'))
```

**Optimization Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  images: {
    domains: ['supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig
```

#### 2. Database Performance

**Query Optimization**
```typescript
// Efficient querying with selective fields
export async function getAnimalsList(farmId: string, options: {
  page: number
  limit: number
  search?: string
}) {
  return db.animal.findMany({
    where: {
      farmId,
      ...(options.search && {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { tagId: { contains: options.search, mode: 'insensitive' } }
        ]
      }
    },
    select: {
      id: true,
      tagId: true,
      name: true,
      type: true,
      status: true,
      imageUrl: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' },
    skip: (options.page - 1) * options.limit,
    take: options.limit
  })
}
```

**Connection Pooling**
```typescript
// Database connection with pooling
const db = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Connection pool settings
  // Prisma handles connection pooling automatically in production
})
```

#### 3. Caching Strategy

**React Query for Data Caching**
```typescript
// lib/queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useAnimals(farmId: string, options: {
  page?: number
  search?: string
} = {}) {
  return useQuery({
    queryKey: ['animals', farmId, options],
    queryFn: () => getAnimalsPaginated(farmId, options),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateAnimal() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAnimal,
    onSuccess: () => {
      // Invalidate and refetch animals list
      queryClient.invalidateQueries({ queryKey: ['animals'] })
    },
  })
}
```

### Deployment Architecture

#### 1. Vercel Deployment

**Build / Run Configuration (Rust)**
```toml
# Cargo-based workflow (examples)
#[Cargo.toml scripts are not native; use the following common commands:]
# Build release
cargo build --release
# Run dev server
cargo run
# Lint (clippy)
cargo clippy -- -D warnings
# Format check
cargo fmt -- --check
# Run tests
cargo test
# Database migrations (tool-dependent, e.g., sqlx-cli or refinery)
# Example: `cargo run --bin migrate` or `sqlx migrate run`
```

**Environment Variables**
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
DATABASE_URL=postgresql://user:password@localhost:5432/jaothui_db
LINE_CLIENT_ID=your-line-client-id
LINE_CLIENT_SECRET=your-line-client-secret
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

#### 2. Infrastructure Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Platform                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   Edge Network   │  │   Build Cache    │                     │
│  │   (Global CDN)   │  │   (Optimized)    │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                        │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   Serverless     │  │   API Routes     │                     │
│  │   Functions     │  │   (Edge Runtime) │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/WS
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Platform                        │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   PostgreSQL    │  │   Auth Service  │                     │
│  │   (Multi-Region) │  │   (JWT)         │                     │
│  └─────────────────┘  └─────────────────┘                     │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐                     │
│  │   File Storage  │  │   Real-time     │                     │
│  │   (Global CDN)   │  │   (WebSockets)  │                     │
│  └─────────────────┘  └─────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

### Scalability Design

#### 1. Horizontal Scaling

**Serverless Auto-Scaling**
```typescript
// Vercel automatically scales based on demand
// No manual scaling configuration needed
```

**Database Scaling**
```sql
-- Read replicas for read-heavy operations
-- Connection pooling for high concurrency
```

#### 2. Data Scaling

**Database Sharding Strategy (Future)**
```typescript
// Farm-based sharding pattern
const getShardKey = (farmId: string) => {
  // Shard farms across multiple database instances
  return `shard_${farmId.slice(-1)}`
}

const getDbConnection = (farmId: string) => {
  const shardKey = getShardKey(farmId)
  return connectionPool[shardKey]
}
```

**File Storage Scaling**
```typescript
// CDN-based file delivery
const getImageUrl = (farmId: string, imageId: string) => {
  return `https://cdn.jaothui.com/animal-images/${farmId}/${imageId}`
}
```

### Monitoring & Observability

#### 1. Application Monitoring

**Error Tracking**
```typescript
// lib/error-tracking.ts
export function captureError(error: Error, context?: any) {
  console.error('Application Error:', error, context)

  // Send to error tracking service (Vercel Analytics or external)
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
  }
}
```

**Performance Monitoring**
```typescript
// lib/performance.ts
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now()
  try {
    return fn()
  } finally {
    const duration = performance.now() - start
    console.log(`${name} took ${duration.toFixed(2)}ms`)

    // Send to monitoring service
    if (duration > 1000) { // Alert on slow operations
      captureError(new Error(`Slow operation: ${name}`), { duration })
    }
  }
}
```

#### 2. Database Monitoring

**Query Performance Tracking**
```typescript
// lib/db-monitoring.ts
const originalQuery = db.animal.findMany

db.animal.findMany = function(...args) {
  const start = Date.now()
  return originalQuery.apply(this, args).then(result => {
    const duration = Date.now() - start

    // Log slow queries
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        duration,
        query: args[0],
        resultCount: result.length
      })
    }

    return result
  })
}
```

### Development Workflow

#### 1. Local Development

**Development Environment Setup (Rust)**
```bash
# Fetch/build dependencies
cargo fetch

# Set up environment
cp .env.example .env.local

# Start database
docker-compose up -d postgres

# Run migrations (tool-dependent, e.g., sqlx-cli or a migration binary)
# Example using a migration binary built into the repo:
cargo run --bin migrate

# Start development server
cargo run
```

**Testing Strategy**
```typescript
// Component testing
import { render, screen } from '@testing-library/react'
import { AnimalCard } from '@/components/features/animals/animal-card'

test('displays animal information', () => {
  const animal = {
    id: '1',
    tagId: '001',
    name: 'นาเดีย',
    type: 'WATER_BUFFALO',
    status: 'ACTIVE'
  }

  render(<AnimalCard animal={animal} />)

  expect(screen.getByText('นาเดีย')).toBeInTheDocument()
  expect(screen.getByText('001')).toBeInTheDocument()
})

// API testing
import { createMocks } from 'node-mocks-http'
import { GET } from '@/app/api/animals/[id]/route'

test('returns animal data', async () => {
  const mocks = createMocks()

  const request = new Request('http://localhost:3000/api/animals/1')
  const response = await GET(request, { params: { id: '1' } })

  expect(response.status).toBe(200)
  expect(response.data.success).toBe(true)
})
```

#### 2. CI/CD Pipeline

**GitHub Actions Workflow**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install Rust toolchain
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
          profile: minimal
      - name: Cache Cargo registry
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry
            ~/.cargo/git
          key: ${{ runner.os }}-cargo-${{ hashFiles('**/Cargo.lock') }}

      - name: Build (release)
        run: cargo build --release

      - name: Run tests
        run: cargo test --all

      - name: Lint (clippy)
        run: cargo clippy --all-targets -- -D warnings

      - name: Format check
        run: cargo fmt -- --check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

**Document Version**: 1.0
**Last Updated**: November 12, 2025