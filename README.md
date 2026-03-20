#  Roompal - Property Listing & Roommate Matching Platform

A full-stack web application for listing properties, finding apartments, and matching with compatible roommates. Built with modern web technologies for a seamless user experience.

##  Features

###  Property Management
- **Property Listings**: Create, view, search, and filter properties
- **Image Upload**: Upload multiple property images (stored on Cloudinary)
- **Advanced Search**: Filter by location, price range, apartment type, bedrooms, bathrooms
- **Pagination**: Browse through properties with pagination
- **Property Details**: Detailed view with image gallery, amenities, and contact information
- **Auto-Approval**: Properties are automatically approved upon submission
- **Contact Information**: Direct contact with property owners via phone/email

###  Roommate Matching
- **Profile Creation**: Create detailed roommate profiles
- **Compatibility Algorithm**: Smart matching based on:
  - Budget similarity (30%)
  - Location match (25%)
  - Gender preference (15%)
  - Cleanliness level (15%)
  - Lifestyle compatibility (10%)
  - Smoking/pets compatibility (5%)
- **Match Scoring**: Get compatibility scores (0-100) for potential roommates
- **Profile Management**: Update and manage your roommate profile

###  Real-Time Messaging
- **Instant Messaging**: Real-time chat using Socket.io
- **Conversation Threads**: Organized message history
- **Read Receipts**: Know when messages are read
- **Online Status**: See who's online
- **Typing Indicators**: See when someone is typing
- **Unread Counts**: Track unread messages

###  Authentication & Security
- **User Registration**: Sign up with email verification
- **Secure Login**: JWT-based authentication
- **Password Reset**: Forgot password functionality
- **Email Verification**: Verify email addresses
- **Protected Routes**: Secure API endpoints
- **Token Refresh**: Automatic token refresh mechanism

##  Tech Stack

### Frontend
- **HTML5, CSS3, JavaScript (ES6+)**
- **Vanilla JS** (No frameworks - lightweight and fast)
- **Fetch API** for HTTP requests
- **Socket.io Client** for real-time messaging
- **Toast Notifications** for user feedback
- **Responsive Design** for all devices

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication tokens
- **Socket.io** - Real-time communication
- **Cloudinary** - Image storage and optimization
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

##  Project Structure

```
roompal/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Service layer
│   │   ├── socket/         # Socket.io handlers
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── README.md
│
├── assets/                 # Frontend assets
│   ├── scripts/           # JavaScript files
│   │   ├── api.js        # API service layer
│   │   ├── toast.js      # Toast notifications
│   │   ├── propertyDetails.js
│   │   ├── listProperty.js
│   │   └── ...
│   ├── styles/           # CSS files
│   └── images/           # Image assets
│
├── reg-users/            # Registered user pages
│   ├── homepage/        # Homepage, property details, my properties
│   ├── list-a-house/   # Property listing form
│   ├── roommate/       # Roommate matching pages
│   ├── message/        # Messaging interface
│   └── ...
│
├── auth/                # Authentication pages
│   ├── verify-email/   # Email verification
│   ├── forget-password.html
│   └── ...
│
├── admin/               # Admin dashboard pages
│   ├── houses/         # Property management
│   └── admin-roomate-listing/
│
├── landing-pages/      # Public landing pages
├── index.html          # Landing page
├── login.html          # Login page
├── register.html       # Registration page
└── README.md           # This file
```

##  Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**
- **Cloudinary Account** (for image uploads)
- **Email Service** (Gmail, SendGrid, etc.)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   PORT=5002
   MONGODB_URI=mongodb://localhost:27017/roompal
   JWT_SECRET=your-secret-key
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   FRONTEND_URL=https://dev-sayo.github.io
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```
   
   Server will run on `http://localhost:5002`

### Frontend Setup

1. **Open the project**
   - The frontend is static HTML/CSS/JS
   - No build process required
   - Serve using any static file server


2. **Using Node.js http-server**
   ```bash
   npm install -g http-server
   http-server -p 3000
   ```

3. **Using VS Code Live Server**
   - Install "Live Server" extension
   - Right-click on `index.html` → "Open with Live Server"

4. **Access the application**
   - Open `http://localhost:3000` in your browser (for local development)
   - Production: https://dev-sayo.github.io/roompal/

##  Key Pages

### Public Pages
- **Landing Page** (`index.html`) - Homepage with property listings
- **Login** (`login.html`) - User login
- **Register** (`register.html`) - User registration

### Registered User Pages
- **Homepage** (`reg-users/homepage/home.html`) - Browse properties
- **Property Details** (`reg-users/homepage/property-details.html`) - View property details
- **List a House** (`reg-users/list-a-house/list-a-house.html`) - Create property listing
- **My Properties** (`reg-users/homepage/my-properties.html`) - Manage your listings
- **Find Roommate** (`reg-users/roommate/roommate.html`) - Roommate matching
- **Messages** (`reg-users/message/in-app-message.html`) - Real-time messaging

### Admin Pages
- **Admin Dashboard** (`admin/admin-home/admin-home.html`)
- **Property Management** (`admin/houses/houses.html`)
- **Roommate Listings** (`admin/admin-roomate-listing/ad-roommies-listing.html`)

##  API Endpoints

### Base URL
**Production:** `https://roompal-wrgn.onrender.com/api`  
**Development:** `http://localhost:5002/api`

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user

### Properties
- `GET /api/properties` - Get all properties (with filters)
- `GET /api/properties/:id` - Get single property
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `DELETE /api/properties/:id` - Delete property
- `GET /api/properties/my/properties` - Get user's properties

### Roommates
- `POST /api/roommates/profile` - Create/update profile
- `GET /api/roommates/me` - Get my profile
- `GET /api/roommates` - Get all active profiles
- `GET /api/roommates/matches` - Get compatibility matches

### Messaging
- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/:conversationId` - Get messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id/read` - Mark as read

See `backend/README.md` for detailed API documentation.

##  Frontend Features

### API Service Layer
- Centralized API communication (`assets/scripts/api.js`)
- Automatic token attachment
- Error handling
- Response parsing

### Toast Notifications
- Success, error, info, and warning toasts
- Auto-dismiss with animations
- Global toast system

### Property Management
- Dynamic property listings
- Image gallery with thumbnails
- Search and filter functionality
- Pagination support
- Loading states and empty states

### Form Handling
- Multi-step form support (converted to single-page)
- File upload with preview
- Input validation
- Auto-formatting (phone numbers)
- Form submission with loading states

##  Security

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Input Validation**: Server and client-side validation
- **CORS**: Configured for frontend communication
- **Rate Limiting**: Prevents abuse
- **File Upload Validation**: Image type and size checks
- **XSS Protection**: Input sanitization

##  Key Dependencies

### Backend
```json
{
  "express": "^4.x",
  "mongoose": "^7.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "nodemailer": "^6.x",
  "multer": "^1.x",
  "cloudinary": "^1.x",
  "socket.io": "^4.x",
  "express-validator": "^7.x",
  "helmet": "^7.x",
  "cors": "^2.x"
}
```

### Frontend
- Vanilla JavaScript (no dependencies)
- Socket.io Client (for real-time messaging)
- Fetch API (native browser API)

##  Testing



### Frontend Testing
1. Open browser DevTools (F12)
2. Check Console for errors
3. Test all user flows:
   - Registration → Email verification → Login
   - Property listing → View details
   - Roommate profile creation → View matches
   - Send messages → Real-time updates

##  Deployment

### Production URLs
- **Frontend:** https://dev-sayo.github.io/roompal/
- **Backend API:** https://roompal-wrgn.onrender.com/api

### Backend Deployment
1. Set up MongoDB Atlas or production MongoDB
2. Configure environment variables:
   - `FRONTEND_URL=https://dev-sayo.github.io`
   - `MONGODB_URI=your-production-mongodb-uri`
   - Other required environment variables
3. Set up Cloudinary production account
4. Configure email service
5. Deploy to Render, Heroku, Railway, or similar platform

### Frontend Deployment
1. The frontend is deployed on GitHub Pages
2. All API calls automatically detect production environment
3. No additional configuration needed - URLs are environment-aware

##  Documentation

- **Backend README**: `backend/README.md` - Complete backend documentation
- **Property Module**: `backend/PROPERTY_MODULE.md` - Property features
- **Roommate Module**: `backend/ROOMMATE_MODULE.md` - Matching algorithm
- **Messaging Module**: `backend/MESSAGING_MODULE.md` - Real-time messaging
- **Testing Guide**: `backend/TESTING_GUIDE.md` - API testing

##  Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC

##  Support

For issues, questions, or contributions, please contact the development team.

---

