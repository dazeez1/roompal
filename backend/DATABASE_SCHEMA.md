# Roompal Database Schema

This document describes the complete database schema for the Roompal platform, including all collections, fields, relationships, and indexes.

## Database: MongoDB

## Collections Overview

1. **users** - User accounts and authentication
2. **properties** - Property listings
3. **roommateprofiles** - Roommate matching profiles
4. **conversations** - Chat conversations between users
5. **messages** - Individual messages within conversations

---

## 1. Users Collection

**Collection Name:** `users`

**Description:** Stores user account information, authentication tokens, and account status.

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Yes | Auto | Primary key |
| `fullName` | String | Yes | - | User's full name (2-100 chars) |
| `email` | String | Yes | - | Unique email address (lowercase) |
| `password` | String | Yes | - | Hashed password (min 6 chars, not returned by default) |
| `isEmailVerified` | Boolean | No | `false` | Email verification status |
| `emailVerificationToken` | String | No | - | Hashed verification token (not returned) |
| `emailVerificationTokenExpiry` | Date | No | - | Token expiration date (not returned) |
| `passwordResetToken` | String | No | - | Hashed reset token (not returned) |
| `passwordResetTokenExpiry` | Date | No | - | Reset token expiration (not returned) |
| `refreshToken` | String | No | - | JWT refresh token (not returned) |
| `role` | String | No | `'user'` | User role: `'user'` or `'admin'` |
| `isActive` | Boolean | No | `true` | Account active status |
| `lastLogin` | Date | No | - | Last login timestamp |
| `createdAt` | Date | Auto | - | Document creation timestamp |
| `updatedAt` | Date | Auto | - | Document update timestamp |

### Indexes

- `email` (unique)

### Relationships

- **One-to-Many** with `properties` (via `owner` field)
- **One-to-One** with `roommateprofiles` (via `user` field)
- **One-to-Many** with `conversations` (as participant)
- **One-to-Many** with `messages` (as sender/receiver)

### Methods

- `comparePassword(candidatePassword)` - Compare password with hash
- `generateEmailVerificationToken()` - Generate email verification token
- `generatePasswordResetToken()` - Generate password reset token
- `clearPasswordResetToken()` - Clear reset token
- `clearEmailVerificationToken()` - Clear verification token

---

## 2. Properties Collection

**Collection Name:** `properties`

**Description:** Stores property listings with details, images, and approval status.

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Yes | Auto | Primary key |
| `owner` | ObjectId (ref: User) | Yes | - | Property owner reference |
| `title` | String | Yes | - | Property title (5-200 chars) |
| `description` | String | Yes | - | Property description (20-5000 chars) |
| `location` | String | Yes | - | Property location (max 200 chars) |
| `price` | Number | Yes | - | Monthly rent price (min 0) |
| `apartmentType` | String | Yes | - | Type: `'Apartments / Flats'`, `'Self-contained rooms'`, `'Shared Apartments'`, `'Detached Houses'`, `'Semi-detached Houses'`, `'Duplexes'`, `'Bungalows'`, `'Serviced Apartments'` |
| `bedrooms` | Number | No | `0` | Number of bedrooms (min 0) |
| `bathrooms` | Number | No | `0` | Number of bathrooms (min 0) |
| `images` | Array[String] | No | `[]` | Array of image URLs (max 10) |
| `isApproved` | Boolean | No | `false` | Admin approval status |
| `isFlagged` | Boolean | No | `false` | Flagged status |
| `flaggedReason` | String | No | - | Reason for flagging |
| `totalArea` | Number | No | - | Total area in square meters (min 0) |
| `amenities` | Array[String] | No | `[]` | List of amenities |
| `availableFrom` | Date | No | - | Availability start date |
| `isAvailable` | Boolean | No | `true` | Current availability status |
| `contactPhone` | String | No | - | Contact phone number (max 20 chars) |
| `createdAt` | Date | Auto | - | Document creation timestamp |
| `updatedAt` | Date | Auto | - | Document update timestamp |

### Indexes

- `{ location: 1, price: 1 }` - Compound index for location/price queries
- `{ apartmentType: 1 }` - Index for type filtering
- `{ isApproved: 1, isAvailable: 1 }` - Compound index for public listings
- `{ owner: 1 }` - Index for owner queries

### Relationships

- **Many-to-One** with `users` (via `owner` field)

### Methods

- `isPublic()` - Returns `true` if property is approved, not flagged, and available

---

## 3. RoommateProfiles Collection

**Collection Name:** `roommateprofiles`

**Description:** Stores roommate matching profiles with preferences and compatibility data.

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Yes | Auto | Primary key |
| `user` | ObjectId (ref: User) | Yes | - | User reference (unique) |
| `gender` | String | Yes | - | Gender: `'Male'`, `'Female'`, `'Other'`, `'Prefer not to say'` |
| `preferredGender` | String | No | `'No Preference'` | Preferred roommate gender: `'Male'`, `'Female'`, `'Other'`, `'No Preference'` |
| `budget` | Number | Yes | - | Monthly budget (min 0) |
| `preferredLocation` | String | Yes | - | Preferred location (max 200 chars) |
| `lifestyle` | String | No | `'Flexible'` | Lifestyle: `'Quiet'`, `'Moderate'`, `'Social'`, `'Party'`, `'Flexible'` |
| `cleanlinessLevel` | Number | No | `3` | Cleanliness level 1-5 |
| `smoking` | Boolean | No | `false` | Smoking preference |
| `pets` | Boolean | No | `false` | Pet preference |
| `occupation` | String | No | - | Occupation (max 100 chars) |
| `bio` | String | No | - | Profile bio (max 1000 chars) |
| `isActive` | Boolean | No | `true` | Profile active status |
| `createdAt` | Date | Auto | - | Document creation timestamp |
| `updatedAt` | Date | Auto | - | Document update timestamp |

### Indexes

- `{ user: 1 }` (unique) - One profile per user
- `{ isActive: 1, preferredLocation: 1 }` - Compound index for active location queries
- `{ isActive: 1, budget: 1 }` - Compound index for active budget queries

### Relationships

- **One-to-One** with `users` (via `user` field, unique)

### Methods

- `isComplete()` - Returns `true` if profile has all required fields

---

## 4. Conversations Collection

**Collection Name:** `conversations`

**Description:** Stores chat conversations between users with metadata.

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Yes | Auto | Primary key |
| `participants` | Array[ObjectId (ref: User)] | Yes | - | Array of user IDs (min 2, max 2) |
| `lastMessage` | ObjectId (ref: Message) | No | - | Reference to last message |
| `lastMessageAt` | Date | No | - | Timestamp of last message |
| `createdAt` | Date | Auto | - | Document creation timestamp |
| `updatedAt` | Date | Auto | - | Document update timestamp |

### Indexes

- `{ participants: 1 }` - Index for participant queries
- `{ lastMessageAt: -1 }` - Index for sorting by recent messages

### Relationships

- **Many-to-Many** with `users` (via `participants` array)
- **One-to-Many** with `messages` (via `conversationId` field)

### Static Methods

- `findOrCreateConversation(userId1, userId2)` - Find existing or create new conversation between two users

---

## 5. Messages Collection

**Collection Name:** `messages`

**Description:** Stores individual messages within conversations.

### Schema Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `_id` | ObjectId | Yes | Auto | Primary key |
| `sender` | ObjectId (ref: User) | Yes | - | Message sender reference |
| `receiver` | ObjectId (ref: User) | Yes | - | Message receiver reference |
| `conversation` | ObjectId (ref: Conversation) | Yes | - | Conversation reference |
| `content` | String | Yes | - | Message content (1-5000 chars) |
| `isRead` | Boolean | No | `false` | Read status |
| `readAt` | Date | No | - | Read timestamp |
| `createdAt` | Date | Auto | - | Document creation timestamp |
| `updatedAt` | Date | Auto | - | Document update timestamp |

### Indexes

- `{ conversation: 1, createdAt: -1 }` - Compound index for conversation messages
- `{ sender: 1, receiver: 1 }` - Compound index for user message queries
- `{ isRead: 1, receiver: 1 }` - Compound index for unread messages

### Relationships

- **Many-to-One** with `users` (via `sender` field)
- **Many-to-One** with `users` (via `receiver` field)
- **Many-to-One** with `conversations` (via `conversation` field)

---

## Entity Relationship Diagram (ERD)

```
┌─────────────┐
│    Users    │
│─────────────│
│ _id (PK)    │
│ fullName    │
│ email (UK)  │
│ password    │
│ role        │
│ isActive    │
└──────┬──────┘
       │
       │ 1
       │
       │ N
┌──────┴──────┐      ┌──────────────────┐
│ Properties │      │ RoommateProfiles │
│────────────│      │──────────────────│
│ _id (PK)   │      │ _id (PK)         │
│ owner (FK) │◄─────┤ user (FK, UK)    │
│ title      │      │ gender           │
│ location   │      │ budget           │
│ price      │      │ preferredLocation│
│ images[]   │      │ lifestyle        │
│ isApproved │      │ isActive         │
└────────────┘      └──────────────────┘
       │
       │
       │
┌──────┴──────────────────────┐
│      Conversations          │
│──────────────────────────────│
│ _id (PK)                     │
│ participants[] (FK to Users) │
│ lastMessage (FK)              │
│ lastMessageAt                │
└──────┬───────────────────────┘
       │
       │ 1
       │
       │ N
┌──────┴──────────────┐
│      Messages      │
│────────────────────│
│ _id (PK)           │
│ sender (FK)        │
│ receiver (FK)      │
│ conversation (FK)  │
│ content            │
│ isRead             │
└────────────────────┘
```

---

## Relationships Summary

1. **User → Properties**: One-to-Many (one user can have many properties)
2. **User → RoommateProfile**: One-to-One (one user has one profile)
3. **User → Conversations**: Many-to-Many (users participate in conversations)
4. **User → Messages**: One-to-Many (user sends/receives many messages)
5. **Conversation → Messages**: One-to-Many (one conversation has many messages)

---

## Indexes Summary

### Users
- `email` (unique)

### Properties
- `{ location: 1, price: 1 }` - Location and price queries
- `{ apartmentType: 1 }` - Type filtering
- `{ isApproved: 1, isAvailable: 1 }` - Public listings
- `{ owner: 1 }` - Owner queries

### RoommateProfiles
- `{ user: 1 }` (unique) - One profile per user
- `{ isActive: 1, preferredLocation: 1 }` - Active location queries
- `{ isActive: 1, budget: 1 }` - Active budget queries

### Conversations
- `{ participants: 1 }` - Participant lookups
- `{ lastMessageAt: -1 }` - Recent conversations

### Messages
- `{ conversationId: 1, createdAt: -1 }` - Conversation messages
- `{ sender: 1, receiver: 1 }` - User message queries
- `{ isRead: 1, receiver: 1 }` - Unread messages

---

## Data Validation Rules

### Users
- Email must be unique and valid format
- Password minimum 6 characters
- Full name 2-100 characters

### Properties
- Title 5-200 characters
- Description 20-5000 characters
- Maximum 10 images per property
- Price cannot be negative

### RoommateProfiles
- One profile per user (enforced by unique index)
- Budget cannot be negative
- Cleanliness level 1-5
- Bio maximum 1000 characters

### Messages
- Content 1-5000 characters
- Cannot send message to self (enforced in controller)
- Conversation must have exactly 2 participants

---

## Security Considerations

1. **Password Fields**: Never returned in queries (select: false)
2. **Token Fields**: Never returned in queries (select: false)
3. **Email Verification**: Required for full account access
4. **Role-Based Access**: Admin vs user roles
5. **Soft Deletes**: `isActive` flag instead of hard deletes
6. **Input Validation**: All fields validated at schema level

---

## Timestamps

All collections include automatic `createdAt` and `updatedAt` timestamps via Mongoose's `timestamps: true` option.

---

## Notes

- All ObjectId references use Mongoose population for efficient queries
- JSON transformation removes `_id` and `__v` fields, adds `id` field
- Indexes are optimized for common query patterns
- All string fields are trimmed automatically
- Email addresses are stored in lowercase
