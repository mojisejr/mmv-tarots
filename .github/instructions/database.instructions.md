---
applyTo: '**'
---
# Database Schema Documentation
## Jaothui ID-Trace System

### Table of Contents
1. [Overview](#overview)
2. [Database Technology](#database-technology)
3. [Schema Design Principles](#schema-design-principles)
4. [Entity Relationship Diagram](#entity-relationship-diagram)
5. [Table Definitions](#table-definitions)
   - [User Table](#user-table)
   - [Farm Table](#farm-table)
   - [FarmMember Table](#farmmember-table)
   - [Animal Table](#animal-table)
   - [Activity Table](#activity-table)
6. [Enums](#enums)
7. [Indexes](#indexes)
8. [Constraints](#constraints)
9. [Row Level Security (RLS)](#row-level-security-rls)
10. [Migration Strategy](#migration-strategy)
11. [Data Access Patterns](#data-access-patterns)
12. [Performance Considerations](#performance-considerations)

### Overview

The Jaothui ID-Trace database schema is designed to support multi-tenant buffalo farm management with secure role-based access control. The system uses PostgreSQL via Supabase with Prisma ORM for type-safe database operations.

### Database Technology

#### Stack Components
- **Database**: PostgreSQL 15+ (via Supabase)
- **ORM**: Prisma with TypeScript
- **Migration**: Prisma Migrate
- **Security**: Row Level Security (RLS) policies
- **Storage**: Supabase Storage for file uploads
- **Real-time**: Supabase Real-time (future enhancement)

#### Connection Details
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Schema Design Principles

1. **Multi-tenancy**: All data is isolated by farm ID
2. **Zero Trust Security**: Every query must verify user permissions
3. **Audit Trail**: All operations include creation/update tracking
4. **Soft Deletes**: Status-based deletion instead of physical deletion
5. **Type Safety**: Strict typing with Prisma and TypeScript
6. **Scalability**: Optimized indexes and query patterns

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    User     │       │     Farm     │       │   Animal    │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ id (PK)     │◄──────┤ id (PK)     │
│ lineId      │       │ name        │       │ farmId (FK) │
│ username    │       │ province    │       │ tagId        │
│ passwordHash│       │ code        │       │ name         │
│ firstName   │       │ ownerId (FK)◄┘       │ type         │
│ lastName    │       │ createdAt   │       │ gender       │
│ avatarUrl   │       │ updatedAt   │       │ status       │
│ createdAt   │       └─────────────┘       │ birthDate    │
│ updatedAt   │               │           │ imageUrl     │
└─────────────┘               │           │ weightKg     │
        │                      │           │ heightCm     │
        │                      │           │ motherTag    │
        │                      │           │ fatherTag    │
        │                      │           │ genome       │
        │                      │           │ createdAt    │
        │                      │           │ updatedAt    │
        │                      │           └─────────────┘
        │                      │                     │
        │                      │           ┌─────────────┐
        │                      │           │   Activity  │
        │                      │           ├─────────────┤
        │                      │           │ id (PK)     │
        │             ┌────────┘           │ farmId (FK) │
        │             │                    │ animalId (FK)◄┘
        │    ┌────────┴────────┐           │ title       │
        │    │   FarmMember    │           │ description │
        │    ├─────────────────┤           │ activityDate│
        │    │ id (PK)         │           │ dueDate     │
        │    │ farmId (FK)     │           │ status      │
        │    │ userId (FK)     │           │ statusReason│
        │    │ role            │           │ createdBy (FK)│
        │    │ joinedAt        │           │ completedBy(FK)│
        │    └─────────────────┘           │ completedAt │
        │                                │ createdAt   │
        │                                │ updatedAt   │
        │                                └─────────────┘
        └─────────────────────────────────┘
```

### Table Definitions

#### User Table

Stores user account information with support for both LINE OAuth and traditional authentication.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lineId VARCHAR(255) UNIQUE,                    -- LINE OAuth identifier (nullable for staff)
    username VARCHAR(255) UNIQUE,                  -- Username for staff login (nullable for owners)
    passwordHash TEXT,                             -- Hashed password (only for staff accounts)
    firstName VARCHAR(255),
    lastName VARCHAR(255),
    avatarUrl TEXT,                               -- Profile image URL
    createdAt TIMESTAMPTZ(6) DEFAULT NOW(),
    updatedAt TIMESTAMPTZ(6) DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_lineId ON users(lineId);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_createdAt ON users(createdAt);
```

**Prisma Schema:**
```prisma
model User {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  lineId       String?   @unique @map("line_id")
  username     String?   @unique
  passwordHash String?   @map("password_hash")
  firstName    String?
  lastName     String?
  avatarUrl    String?   @map("avatar_url")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  ownedFarms    Farm[]       @relation("OwnerFarms")
  memberships   FarmMember[]
  createdEvents Activity[] @relation("Creator")
  completedEvents Activity[] @relation("Completer")

  @@map("users")
}
```

#### Farm Table

Represents individual farms with basic information and ownership.

```sql
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL DEFAULT 'ฟาร์มของฉัน',
    ownerId UUID NOT NULL,                         -- Farm owner reference
    province VARCHAR(255) DEFAULT 'ไม่ระบุ',
    code VARCHAR(255) UNIQUE,                     -- Optional farm code
    createdAt TIMESTAMPTZ(6) DEFAULT NOW(),
    updatedAt TIMESTAMPTZ(6) DEFAULT NOW(),

    FOREIGN KEY (ownerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_farms_ownerId ON farms(ownerId);
CREATE INDEX idx_farms_code ON farms(code);
CREATE INDEX idx_farms_province ON farms(province);
```

**Prisma Schema:**
```prisma
model Farm {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name      String    @default("ฟาร์มของฉัน") @map("farm_name")
  ownerId   String    @map("owner_id") @db.Uuid
  province  String?   @default("ไม่ระบุ")
  code      String?   @unique @map("farm_code")
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  owner   User         @relation("OwnerFarms", fields: [ownerId], references: [id], onDelete: Cascade)
  members FarmMember[]
  animals Animal[]
  events  Activity[]

  @@map("farms")
}
```

#### FarmMember Table

Join table managing user memberships and roles within farms.

```sql
CREATE TABLE farm_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmId UUID NOT NULL,
    userId UUID NOT NULL,
    role FarmRole NOT NULL DEFAULT 'MEMBER',
    joinedAt TIMESTAMPTZ(6) DEFAULT NOW(),

    FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,

    UNIQUE(farmId, userId)  -- Each user can only have one membership per farm
);

-- Indexes
CREATE INDEX idx_farm_members_farmId ON farm_members(farmId);
CREATE INDEX idx_farm_members_userId ON farm_members(userId);
CREATE INDEX idx_farm_members_role ON farm_members(role);
```

**Prisma Schema:**
```prisma
model FarmMember {
  id       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  farmId   String   @map("farm_id") @db.Uuid
  userId   String   @map("user_id") @db.Uuid
  role     Role     @default(MEMBER)
  joinedAt DateTime @default(now()) @map("joined_at") @db.Timestamptz(6)

  // Relations
  farm Farm @relation(fields: [farmId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([farmId, userId])
  @@map("farm_members")
}
```

#### Animal Table

Stores comprehensive buffalo/cattle information with farm association.

```sql
CREATE TABLE animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmId UUID NOT NULL,                         -- Farm association
    tagId VARCHAR(255) NOT NULL,                   -- Farm-unique identifier
    name VARCHAR(255),                            -- Optional friendly name
    type AnimalType NOT NULL DEFAULT 'WATER_BUFFALO',
    gender AnimalGender DEFAULT 'FEMALE',
    status AnimalStatus DEFAULT 'ACTIVE',
    birthDate DATE,                               -- Birth date (optional)
    color VARCHAR(255),                           -- Color description
    weightKg DECIMAL(8,2),                       -- Weight in kilograms (optional)
    heightCm INTEGER,                             -- Height in centimeters (optional)
    motherTag VARCHAR(255),                       -- Mother's tag ID (optional)
    fatherTag VARCHAR(255),                       -- Father's tag ID (optional)
    genome TEXT,                                   -- Genome information (optional)
    imageUrl TEXT,                                -- Profile image URL (optional)
    createdAt TIMESTAMPTZ(6) DEFAULT NOW(),
    updatedAt TIMESTAMPTZ(6) DEFAULT NOW(),

    FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,

    UNIQUE(farmId, tagId)  -- Tag ID must be unique within each farm
);

-- Indexes
CREATE INDEX idx_animals_farmId ON animals(farmId);
CREATE INDEX idx_animals_tagId ON animals(tagId);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_type ON animals(type);
CREATE INDEX idx_animals_gender ON animals(gender);
CREATE INDEX idx_animals_birthDate ON animals(birthDate);
```

**Prisma Schema:**
```prisma
model Animal {
  id          String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  farmId      String        @map("farm_id") @db.Uuid
  tagId       String        @map("tag_id")
  name        String?
  type        AnimalType    @default(WATER_BUFFALO)
  gender      AnimalGender  @default(FEMALE)
  status      AnimalStatus  @default(ACTIVE)
  birthDate   DateTime?     @map("birth_date") @db.Date
  color       String?
  weightKg    Decimal?      @map("weight_kg") @db.Decimal(8, 2)
  heightCm    Int?          @map("height_cm")
  motherTag   String?       @map("mother_tag")
  fatherTag   String?       @map("father_tag")
  genome      String?
  imageUrl    String?       @map("image_url")
  createdAt   DateTime      @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime      @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  farm       Farm        @relation(fields: [farmId], references: [id], onDelete: Cascade)
  activities Activity[]

  @@unique([farmId, tagId])
  @@map("animals")
}
```

#### Activity Table

Tracks all activities and events related to animals with comprehensive audit trail.

```sql
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmId UUID NOT NULL,                         -- Farm association for permissions
    animalId UUID NOT NULL,                       -- Associated animal
    title VARCHAR(255) NOT NULL,                  -- Activity title
    description TEXT,                              -- Detailed description (optional)
    activityDate DATE NOT NULL,                  -- Date when activity occurred/scheduled
    dueDate DATE,                                -- Due date for the activity (optional)
    status ActivityStatus DEFAULT 'PENDING',     -- Current activity status
    statusReason TEXT,                           -- Reason for status change (optional)
    createdBy UUID NOT NULL,                      -- User who created the activity
    completedBy UUID,                            -- User who completed the activity (optional)
    completedAt TIMESTAMPTZ(6),                  -- Completion timestamp (optional)
    createdAt TIMESTAMPTZ(6) DEFAULT NOW(),
    updatedAt TIMESTAMPTZ(6) DEFAULT NOW(),

    FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (animalId) REFERENCES animals(id) ON DELETE CASCADE,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (completedBy) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_activities_farmId ON activities(farmId);
CREATE INDEX idx_activities_animalId ON activities(animalId);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_activityDate ON activities(activityDate);
CREATE INDEX idx_activities_dueDate ON activities(dueDate);
CREATE INDEX idx_activities_createdBy ON activities(createdBy);
CREATE INDEX idx_activities_createdAt ON activities(createdAt);
```

**Prisma Schema:**
```prisma
model Activity {
  id           String         @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  farmId       String         @map("farm_id") @db.Uuid
  animalId     String         @map("animal_id") @db.Uuid
  title        String
  description  String?
  activityDate DateTime      @map("activity_date") @db.Date
  dueDate      DateTime?      @map("due_date") @db.Date
  status       ActivityStatus @default(PENDING)
  statusReason String?        @map("status_reason")
  createdBy    String         @map("created_by") @db.Uuid
  completedBy  String?        @map("completed_by") @db.Uuid
  completedAt  DateTime?      @map("completed_at") @db.Timestamptz(6)
  createdAt    DateTime       @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt    DateTime       @updatedAt @map("updated_at") @db.Timestamptz(6)

  // Relations
  farm       Farm    @relation(fields: [farmId], references: [id], onDelete: Cascade)
  animal     Animal  @relation(fields: [animalId], references: [id], onDelete: Cascade)
  creator    User    @relation("Creator", fields: [createdBy], references: [id], onDelete: SetNull)
  completer User?   @relation("Completer", fields: [completedBy], references: [id], onDelete: SetNull)

  @@map("activities")
}
```

### Enums

#### FarmRole Enum
```sql
CREATE TYPE farm_role AS ENUM (
    'OWNER',    -- Farm owner with full permissions
    'MEMBER'   -- Farm staff with limited permissions
);
```

#### AnimalType Enum
```sql
CREATE TYPE animal_type AS ENUM (
    'WATER_BUFFALO',  -- กระบือน้ำ
    'SWAMP_BUFFALO',  -- กระบือลุ่นน้ำ
    'CATTLE',         -- โค
    'GOAT',           -- แพะ
    'PIG',            -- หมู
    'CHICKEN'         -- ไก่
);
```

#### AnimalGender Enum
```sql
CREATE TYPE animal_gender AS ENUM (
    'MALE',    -- ผู้
    'FEMALE',  -- เมีย
    'UNKNOWN'  -- ไม่ทราบ
);
```

#### AnimalStatus Enum
```sql
CREATE TYPE animal_status AS ENUM (
    'ACTIVE',      -- ใช้งานอยู่
    'TRANSFERRED', -- โอนย้าย
    'DECEASED',    -- เสียชีวิต
    'SOLD'        -- ขาย
);
```

#### ActivityStatus Enum
```sql
CREATE TYPE activity_status AS ENUM (
    'PENDING',    -- รอดำเนินการ
    'COMPLETED',  -- ดำเนินการสำเร็จ
    'CANCELLED',  -- ยกเลิก
    'OVERDUE'     -- เลยกเวลา
);
```

### Indexes

#### Performance Indexes
```sql
-- User table indexes
CREATE INDEX CONCURRENTLY idx_users_lineId ON users(lineId);
CREATE INDEX CONCURRENTLY idx_users_username ON users(username);

-- Farm table indexes
CREATE INDEX CONCURRENTLY idx_farms_ownerId ON farms(ownerId);
CREATE INDEX CONCURRENTLY idx_farms_code ON farms(code);

-- Animal table indexes
CREATE INDEX CONCURRENTLY idx_animals_farmId ON animals(farmId);
CREATE INDEX CONCURRENTLY idx_animals_status ON animals(status);
CREATE INDEX CONCURRENTLY idx_animals_farm_status ON animals(farmId, status);
CREATE INDEX CONCURRENTLY idx_animals_type ON animals(type);

-- Activity table indexes
CREATE INDEX CONCURRENTLY idx_activities_farmId ON activities(farmId);
CREATE INDEX CONCURRENTLY idx_activities_animalId ON activities(animalId);
CREATE INDEX CONCURRENTLY idx_activities_status ON activities(status);
CREATE INDEX CONCURRENTLY idx_activities_farm_animal ON activities(farmId, animalId);
CREATE INDEX CONCURRENTLY idx_activities_due_status ON activities(dueDate, status);
```

#### Full-Text Search Indexes
```sql
-- For animal search functionality
CREATE INDEX CONCURRENTLY idx_animals_search ON animals
USING gin(to_tsvector('thai', name || ' ' || tagId || ' ' || COALESCE(color, '')));
```

### Constraints

#### Data Integrity Constraints
```sql
-- Ensure farm codes are unique
ALTER TABLE farms ADD CONSTRAINT farms_code_unique UNIQUE (code);

-- Ensure tag IDs are unique within each farm
ALTER TABLE animals ADD CONSTRAINT animals_farm_tag_unique UNIQUE (farmId, tagId);

-- Ensure users can only have one membership per farm
ALTER TABLE farm_members ADD CONSTRAINT farm_members_unique UNIQUE (farmId, userId);

-- Check constraints for data validation
ALTER TABLE animals ADD CONSTRAINT animals_weight_positive
CHECK (weightKg IS NULL OR weightKg > 0);

ALTER TABLE animals ADD CONSTRAINT animals_height_positive
CHECK (heightCm IS NULL OR heightCm > 0);

ALTER TABLE activities ADD CONSTRAINT activities_due_after_activity
CHECK (dueDate IS NULL OR dueDate >= activityDate);
```

### Row Level Security (RLS)

#### RLS Policies for Users Table
```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_view_own_profile" ON users
    FOR SELECT
    USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "users_update_own_profile" ON users
    FOR UPDATE
    USING (auth.uid()::text = id::text)
    WITH CHECK (auth.uid()::text = id::text);
```

#### RLS Policies for Farms Table
```sql
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- Users can view farms they are members of
CREATE POLICY "farms_view_member_farms" ON farms
    FOR SELECT
    USING (
        id IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );

-- Only farm owners can update farm information
CREATE POLICY "farms_owner_update" ON farms
    FOR UPDATE
    USING (
        ownerId = auth.uid() AND
        EXISTS (
            SELECT 1 FROM farm_members
            WHERE farmId = id AND userId = auth.uid() AND role = 'OWNER'
        )
    );
```

#### RLS Policies for Animals Table
```sql
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;

-- Users can view animals from farms they are members of
CREATE POLICY "animals_view_member_farms" ON animals
    FOR SELECT
    USING (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );

-- Farm members can create animals in their farms
CREATE POLICY "animals_create_member_farms" ON animals
    FOR INSERT
    WITH CHECK (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );

-- Farm members can update animals in their farms
CREATE POLICY "animals_update_member_farms" ON animals
    FOR UPDATE
    USING (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );
```

#### RLS Policies for Activities Table
```sql
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Users can view activities from farms they are members of
CREATE POLICY "activities_view_member_farms" ON activities
    FOR SELECT
    USING (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );

-- Farm members can create activities in their farms
CREATE POLICY "activities_create_member_farms" ON activities
    FOR INSERT
    WITH CHECK (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        ) AND
        createdBy = auth.uid()
    );

-- Farm members can update activities in their farms
CREATE POLICY "activities_update_member_farms" ON activities
    FOR UPDATE
    USING (
        farmId IN (
            SELECT farmId
            FROM farm_members
            WHERE userId = auth.uid()
        )
    );
```

#### Migration Strategy

#### Initial Migration
```prisma
// Initial migration file: 001_initial_schema.sql

-- Create enums
CREATE TYPE farm_role AS ENUM ('OWNER', 'MEMBER');
CREATE TYPE animal_type AS ENUM ('WATER_BUFFALO', 'SWAMP_BUFFALO', 'CATTLE', 'GOAT', 'PIG', 'CHICKEN');
CREATE TYPE animal_gender AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');
CREATE TYPE animal_status AS ENUM ('ACTIVE', 'TRANSFERRED', 'DECEASED', 'SOLD');
CREATE TYPE activity_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'OVERDUE');

-- Create tables
-- (Table definitions as shown above)

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create initial RLS policies
-- (Policy definitions as shown above)
```

npx prisma migrate reset
#### Migration Process
```bash
# Generate migration (tool-dependent)
# Example using sqlx-cli:
#   sqlx migrate add initial_schema
#   sqlx migrate run

# Or, if the repo includes a migration binary:
#   cargo run --bin migrate -- add initial_schema
#   cargo run --bin migrate -- run

# Apply migrations (production)
#   sqlx migrate run

# Reset database (development only, tool-dependent)
#   sqlx database reset
```

### Data Access Patterns

#### Database Client Configuration (Rust example)
```rust
// src/db.rs (example using sqlx)
use sqlx::postgres::PgPoolOptions;

pub async fn create_db_pool(database_url: &str) -> sqlx::Pool<sqlx::Postgres> {
    PgPoolOptions::new()
        .max_connections(5)
        .connect(database_url)
        .await
        .expect("Failed to create Postgres pool")
}
```

#### Secure Query Patterns
```typescript
// lib/auth.ts
import { db } from './db'
import { auth } from './auth'

export async function getAccessibleFarms(userId: string) {
  return db.farm.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: {
      members: {
        where: { userId },
        select: { role: true }
      }
    }
  })
}

export async function getFarmAnimals(farmId: string, userId: string) {
  // Verify user has access to farm
  const hasAccess = await db.farmMember.findUnique({
    where: {
      farmId_userId: {
        farmId,
        userId
      }
    }
  })

  if (!hasAccess) {
    throw new Error('Access denied')
  }

  return db.animal.findMany({
    where: { farmId },
    orderBy: { createdAt: 'desc' }
  })
}
```

#### Permission Validation Middleware
```typescript
// middleware/permissions.ts
export async function requireFarmMembership(request: Request, farmId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  const membership = await db.farmMember.findUnique({
    where: {
      farmId_userId: {
        farmId,
        userId: session.user.id
      }
    }
  })

  if (!membership) {
    throw new Error('Access denied')
  }

  return membership
}
```

### Performance Considerations

#### Query Optimization
```typescript
// Efficient animal listing with pagination
async function getAnimalsPaginated(
  farmId: string,
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: AnimalStatus
    search?: string
  }
) {
  const skip = (page - 1) * limit

  const where: any = { farmId }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { tagId: { contains: filters.search, mode: 'insensitive' } }
    ]
  }

  const [animals, total] = await Promise.all([
    db.animal.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tagId: true,
        name: true,
        type: true,
        status: true,
        gender: true,
        birthDate: true,
        imageUrl: true
      }
    }),
    db.animal.count({ where })
  ])

  return {
    animals,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}
```

#### Database Connection Pooling
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings
  directUrl = env("DIRECT_URL")
}
```

#### Caching Strategy
```typescript
// lib/cache.ts
const CACHE_TTL = 300 // 5 minutes

export async function getCachedAnimals(farmId: string) {
  const cacheKey = `animals:${farmId}`

  // Try cache first
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }

  // Query database
  const animals = await db.animal.findMany({
    where: { farmId },
    include: {
      _count: {
        select: { activities: true }
      }
    }
  })

  // Cache result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(animals))

  return animals
}
```

#### Bulk Operations
```typescript
// Efficient bulk activity creation
async function createActivitiesBulk(activities: ActivityInput[]) {
  // Group by farm for permission checking
  const activitiesByFarm = activities.reduce((acc, activity) => {
    if (!acc[activity.farmId]) {
      acc[activity.farmId] = []
    }
    acc[activity.farmId].push(activity)
    return acc
  }, {} as Record<string, ActivityInput[]>)

  // Verify permissions for each farm
  const results = await Promise.all(
    Object.entries(activitiesByFarm).map(async ([farmId, farmActivities]) => {
      await requireFarmMembership(farmId)

      return db.activity.createMany({
        data: farmActivities,
        skipDuplicates: true
      })
    })
  )

  return results
}
```

---

**Document Version**: 1.0
**Last Updated**: November 12, 2025