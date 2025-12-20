# Integration Guide: Better Auth with Prediction API

## Overview
เอกสารนี้แนะนำวิธีการ refactor POST /api/predict เพื่อใช้ Better Auth session แทน client-provided `userIdentifier`

## Current Implementation

### Request Flow (ปัจจุบัน)
```typescript
// Client sends userIdentifier in request body
POST /api/predict
{
  "question": "...",
  "userIdentifier": "anonymous-123" // Optional, client-provided
}
```

### Database Storage (ปัจจุบัน)
```typescript
await db.prediction.create({
  data: {
    jobId,
    userIdentifier: validBody.userIdentifier || null, // Can be null
    question: validBody.question,
    status: 'PENDING'
  }
})
```

## Future Implementation (with Better Auth)

### Request Flow (แนะนำ)
```typescript
// Client no longer sends userIdentifier
POST /api/predict
{
  "question": "..." // Only question is required
}
```

### Server-side Authentication
```typescript
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest): Promise<Response> {
  // 1. Get session from Better Auth
  const session = await auth.api.getSession({
    headers: request.headers
  });
  
  // 2. Check if user is authenticated (optional enforcement)
  if (!session?.user) {
    // Option A: Require authentication
    return new Response(
      JSON.stringify({ error: 'Authentication required' }),
      { status: 401 }
    );
    
    // Option B: Allow anonymous (backward compatible)
    // Continue with session.user = null
  }
  
  // 3. Use session.user.id as userIdentifier
  const userId = session?.user?.id || null;
  
  // ... rest of the code
}
```

### Database Storage (แนะนำ)
```typescript
await db.prediction.create({
  data: {
    jobId,
    userIdentifier: userId, // From session, not request body
    question: validBody.question,
    status: 'PENDING'
  }
})
```

## Migration Strategy

### Phase 1: Preparation (Current)
- ✅ Better Auth infrastructure setup
- ✅ UI shows login/logout buttons
- ✅ Session management working
- ⏳ Database migration ready (needs real DB)

### Phase 2: Optional Authentication (Recommended First Step)
```typescript
// Accept both authenticated and anonymous users
const session = await auth.api.getSession({ headers: request.headers });
const userId = session?.user?.id || validBody.userIdentifier || null;

await db.prediction.create({
  data: {
    jobId,
    userIdentifier: userId, // Prefer session, fallback to request body
    question: validBody.question,
    status: 'PENDING'
  }
})
```

### Phase 3: Required Authentication (Optional)
```typescript
// Require authentication for all predictions
const session = await auth.api.getSession({ headers: request.headers });

if (!session?.user) {
  return new Response(
    JSON.stringify({ 
      error: 'Please login to get a tarot reading',
      code: 'AUTH_REQUIRED'
    }),
    { status: 401 }
  );
}

await db.prediction.create({
  data: {
    jobId,
    userIdentifier: session.user.id, // Always from session
    question: validBody.question,
    status: 'PENDING'
  }
})
```

## Type Updates

### Update PostPredictRequest (Phase 2)
```typescript
export interface PostPredictRequest {
  question: string
  // userIdentifier is deprecated - will be removed in Phase 3
  userIdentifier?: string // @deprecated Use session instead
}
```

### Update PostPredictRequest (Phase 3)
```typescript
export interface PostPredictRequest {
  question: string
  // userIdentifier removed completely
}
```

## Testing Checklist

### Before Refactoring
- [ ] Verify current POST /api/predict works with anonymous users
- [ ] Check existing prediction history functionality

### After Phase 2 (Optional Auth)
- [ ] Test with authenticated user (session.user.id stored)
- [ ] Test with anonymous user (backward compatible)
- [ ] Verify prediction history shows correct user data

### After Phase 3 (Required Auth)
- [ ] Test authenticated user can create predictions
- [ ] Test anonymous user gets 401 error
- [ ] Update client-side to show login prompt if not authenticated
- [ ] Verify all predictions have valid userIdentifier

## Client-side Changes

### Current Client Code
```typescript
// Client currently sends userIdentifier
const response = await fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: userQuestion,
    userIdentifier: 'anonymous-123' // Client-provided
  })
});
```

### Updated Client Code (Phase 2+)
```typescript
// Client no longer sends userIdentifier (automatically from session)
const response = await fetch('/api/predict', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Important: Send cookies for session
  body: JSON.stringify({
    question: userQuestion
    // userIdentifier removed
  })
});

// Handle 401 if authentication required (Phase 3)
if (response.status === 401) {
  // Redirect to login
  window.location.href = '/api/auth/signin/line';
}
```

## Benefits of Better Auth Integration

### Security
- ✅ User identity verified by OAuth (Line Login)
- ✅ Cannot spoof userIdentifier
- ✅ Session-based authentication

### Features
- ✅ Personalized prediction history
- ✅ User profile and settings
- ✅ Points and referral system
- ✅ Email notifications (if user has email)

### Data Integrity
- ✅ One user = one identity across all predictions
- ✅ Easy to query user's prediction history
- ✅ Better analytics and insights

## Notes

1. **Backward Compatibility**: Phase 2 maintains compatibility with existing anonymous users
2. **Database Migration**: Run `npx prisma migrate dev --name add_better_auth` when database is ready
3. **Environment Variables**: Ensure LINE_CLIENT_ID, LINE_CLIENT_SECRET, and BETTER_AUTH_SECRET are set
4. **Testing**: Test both authenticated and anonymous flows in Phase 2 before moving to Phase 3

## Related Files

- `app/api/predict/route.ts` - Main prediction API endpoint
- `lib/auth.ts` - Better Auth server configuration
- `lib/auth-client.ts` - Client-side auth hooks
- `types/api.ts` - API type definitions
- `prisma/schema.prisma` - Database schema with User relations

---

**Last Updated**: 2025-12-20
**Status**: Phase 1 & 2 Complete, Phase 3 Ready for Implementation
