# Roompal Backend API

A comprehensive backend API for Roompal - a property listing and roommate matching platform built with Node.js, Express, MongoDB, and Socket.io.

## Features

### Authentication & User Management
- ✅ User Registration with Email Verification
- ✅ User Login with JWT Tokens
- ✅ Email Verification System
- ✅ Password Reset Functionality
- ✅ Protected Routes with JWT Middleware
- ✅ Token Refresh Mechanism
- ✅ Rate Limiting for Security
- ✅ Input Validation
- ✅ Error Handling

### Property Management
- ✅ Create, Read, Update, Delete Properties
- ✅ Image Upload to Cloudinary (up to 10 images per property)
- ✅ Auto-approval System (properties approved immediately)
- ✅ Property Filtering (location, price, type, bedrooms, bathrooms)
- ✅ Pagination Support
- ✅ Property Search
- ✅ Admin Flagging System
- ✅ Contact Phone Number Support

### Roommate Matching
- ✅ Create/Update Roommate Profiles
- ✅ Compatibility-Based Matching Algorithm
- ✅ Match Scoring (Budget, Location, Gender, Lifestyle, Cleanliness)
- ✅ Active Profile Management
- ✅ Profile Search and Filtering

### Real-Time Messaging
- ✅ Socket.io Real-Time Communication
- ✅ Message Persistence
- ✅ Conversation Threads
- ✅ Read Receipts
- ✅ Online/Offline Status
- ✅ Typing Indicators
- ✅ Unread Message Count

##  Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Email Service**: Nodemailer
- **File Upload**: Multer + Cloudinary
- **Real-Time**: Socket.io
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

##  Project Structure

```
backend/
└── src/
    ├── config/
    │   ├── database.js          # MongoDB connection
    │   ├── email.js              # Email service configuration
    │   └── cloudinary.js         # Cloudinary image upload config
    ├── controllers/
    │   ├── authController.js     # Authentication logic
    │   ├── propertyController.js # Property CRUD operations
    │   ├── roommateController.js  # Roommate profile & matching
    │   └── messageController.js   # Messaging operations
    ├── middleware/
    │   ├── authMiddleware.js      # JWT verification middleware
    │   ├── validationMiddleware.js # Request validation
    │   └── uploadMiddleware.js    # File upload handling
    ├── models/
    │   ├── User.js                # User schema/model
    │   ├── Property.js            # Property schema/model
    │   ├── RoommateProfile.js     # Roommate profile schema
    │   ├── Message.js             # Message schema
    │   └── Conversation.js        # Conversation schema
    ├── routes/
    │   ├── authRoutes.js          # Authentication routes
    │   ├── propertyRoutes.js      # Property API routes
    │   ├── roommateRoutes.js      # Roommate API routes
    │   └── messageRoutes.js       # Messaging API routes
    ├── services/
    │   ├── emailService.js        # Email sending service
    │   ├── tokenService.js        # JWT token generation/verification
    │   ├── matchingService.js     # Compatibility matching algorithm
    │   └── socketService.js       # Socket.io service
    ├── socket/
    │   └── socketHandler.js       # Socket.io event handlers
    └── utils/
        ├── errorHandler.js        # Error handling utilities
        └── responseHandler.js     # Standardized API responses
```

##  Installation

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration (see Environment Variables section below).

3. **Start MongoDB**
   Make sure MongoDB is running on your system or use MongoDB Atlas.

4. **Run the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

##  Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5002
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/roompal
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roompal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@roompal.com

# Frontend URL (for email links)
FRONTEND_URL=https://dev-sayo.github.io

# Application Name
APP_NAME=Roompal

# Cloudinary Configuration (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

##  API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/verify-email` | Verify email with token | No |
| POST | `/api/auth/resend-verification` | Resend verification email | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| POST | `/api/auth/refresh-token` | Refresh access token | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Property Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/properties` | Get all approved properties (with filters) | No |
| GET | `/api/properties/:id` | Get single property by ID | No |
| POST | `/api/properties` | Create new property | Yes |
| PUT | `/api/properties/:id` | Update property | Yes (Owner/Admin) |
| DELETE | `/api/properties/:id` | Delete property | Yes (Owner/Admin) |
| GET | `/api/properties/my/properties` | Get user's own properties | Yes |
| PUT | `/api/properties/:id/approve` | Approve property (Admin) | Yes (Admin) |
| PUT | `/api/properties/:id/flag` | Flag property (Admin) | Yes (Admin) |

**Query Parameters for GET /api/properties:**
- `location` - Filter by location
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `apartmentType` - Filter by type
- `bedrooms` - Minimum bedrooms
- `bathrooms` - Minimum bathrooms
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `sort` - Sort order (default: -createdAt)

### Roommate Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/roommates/profile` | Create or update roommate profile | Yes |
| GET | `/api/roommates/me` | Get current user's profile | Yes |
| GET | `/api/roommates` | Get all active profiles (public) | No |
| GET | `/api/roommates/matches` | Get compatibility matches | Yes |

### Messaging Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/messages/conversations` | Get all user conversations | Yes |
| GET | `/api/messages/:conversationId` | Get messages in conversation | Yes |
| POST | `/api/messages` | Send a message | Yes |
| PUT | `/api/messages/:id/read` | Mark message as read | Yes |

### Socket.io Events

**Client → Server:**
- `send_message` - Send a message
- `message_read` - Mark message as read
- `typing_start` - User started typing
- `typing_stop` - User stopped typing

**Server → Client:**
- `message_received` - New message received
- `message_read_confirmation` - Message read confirmation
- `user_online` - User came online
- `user_offline` - User went offline
- `typing` - User is typing

##  Request/Response Examples

### Register User
```json
POST /api/auth/register
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### Create Property
```json
POST /api/properties
Content-Type: multipart/form-data
{
  "title": "Spacious 2 Bedroom Apartment",
  "description": "Beautiful apartment in prime location...",
  "location": "Lagos, Ikeja",
  "price": 200000,
  "apartmentType": "Apartments / Flats",
  "bedrooms": 2,
  "bathrooms": 2,
  "contactPhone": "+234 801 234 5678",
  "images": [File, File, ...]
}
```

### Get Properties with Filters
```
GET /api/properties?location=Lagos&minPrice=100000&maxPrice=500000&apartmentType=Apartments%20%2F%20Flats&page=1&limit=12
```

### Create Roommate Profile
```json
POST /api/roommates/profile
{
  "gender": "Male",
  "preferredGender": "No Preference",
  "budget": 150000,
  "preferredLocation": "Lagos, Ikeja",
  "lifestyle": "Moderate",
  "cleanlinessLevel": 4,
  "smoking": false,
  "pets": false,
  "occupation": "Software Developer",
  "bio": "Looking for a clean, quiet roommate..."
}
```

### Get Matches
```
GET /api/roommates/matches
Returns: Array of profiles with compatibilityScore (0-100)
```

##  Security Features

- **Password Hashing**: bcrypt with salt rounds of 10
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevents brute force attacks
- **Input Validation**: Validates all user inputs
- **CORS**: Configured for frontend communication
- **Helmet**: Security headers
- **Token Expiration**: Access tokens (15 min), Refresh tokens (7 days)
- **File Upload Validation**: Image type and size validation
- **Socket.io Authentication**: JWT verification for WebSocket connections

## Email Configuration

### Gmail Setup

1. Enable 2-Step Verification on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Use the app password in `EMAIL_PASSWORD`

### Other SMTP Providers

Update the `.env` file with your SMTP provider's settings:
- **Outlook**: `smtp-mail.outlook.com`, port 587
- **SendGrid**: `smtp.sendgrid.net`, port 587
- **Mailgun**: `smtp.mailgun.org`, port 587

##  Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Add them to your `.env` file

##  Testing

You can test the API using:
- **Postman**
- **cURL**
- **Thunder Client** (VS Code extension)
- **Frontend Application**

See `TESTING_GUIDE.md` for detailed testing instructions.

##  Development

```bash
# Install dependencies
npm install

# Run in development mode (with auto-reload)
npm run dev

# Run in production mode
npm start
```

## Additional Documentation

- `PROPERTY_MODULE.md` - Property module documentation
- `ROOMMATE_MODULE.md` - Roommate matching documentation
- `MESSAGING_MODULE.md` - Real-time messaging documentation
- `TESTING_GUIDE.md` - API testing guide
- `SETUP.md` - Detailed setup instructions

##  Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set up proper email service
5. Configure CORS for production frontend URL
6. Use environment variables for all sensitive data
7. Set up Cloudinary for production
8. Configure Socket.io for production (consider Redis adapter for scaling)

## 📄 License


