# 🎓 CampusConnect Backend

A complete backend system for campus event management, student collaboration, and real-time communication.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Socket.IO Events](#socketio-events)
- [Project Structure](#project-structure)
- [Business Rules](#business-rules)

## ✨ Features

- 🔐 **Authentication System** - JWT-based auth with email OTP verification
- 👥 **User Roles** - Student and College Admin roles
- 🎉 **Event Management** - Create, update, delete events with admin approval workflow
- 🔍 **Advanced Search** - Search students by skills, interests, department, year
- 📝 **Application System** - Apply to events with status tracking
- 💬 **Real-time Chat** - Socket.IO powered chat for shortlisted/selected applicants
- 🔔 **Notifications** - Real-time notifications for all major actions
- 📧 **Email System** - OTP emails and bulk emails to applicants
- 🏆 **Experience Tracking** - Auto-generate experience records on event completion
- ⚡ **Fully Async** - All operations use async/await for better performance

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (Access Token Only)
- **Password Hashing**: bcrypt
- **Real-time**: Socket.io
- **Email**: Nodemailer
- **Validation**: Joi
- **Environment**: dotenv
- **CORS**: cors

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn**

## 🚀 Installation

1. **Clone the repository or extract the project folder**

2. **Navigate to project directory**
```bash
cd campusconnect-backend
```

3. **Install dependencies**
```bash
npm install
```

## 🔧 Environment Variables

1. **Copy the example environment file**
```bash
cp .env.example .env
```

2. **Edit `.env` and configure the following:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusconnect
DB_USER=postgres
DB_PASSWORD=your_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_FROM=CampusConnect <noreply@campusconnect.com>

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# OTP Configuration
OTP_EXPIRY_MINUTES=10
```

### 📧 Gmail SMTP Setup

To use Gmail for sending emails:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account Settings → Security → 2-Step Verification → App Passwords
   - Generate a password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

## 🗄 Database Setup

1. **Create PostgreSQL Database**
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE campusconnect;

# Exit
\q
```

2. **Sync Database Tables**
```bash
npm run db:sync
```

This will create all required tables in your database.

## ▶️ Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT"  // or "COLLEGE_ADMIN"
}
```

#### Verify Email
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

#### Resend OTP
```http
POST /api/auth/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Event Endpoints

#### Get All Approved Events
```http
GET /api/events?page=1&limit=10&category=TECH&search=hackathon
```

#### Get Event by ID
```http
GET /api/events/:id
```

#### Get My Events
```http
GET /api/events/my-events
Authorization: Bearer <token>
```

#### Create Event
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Annual Tech Fest",
  "description": "A 3-day technology festival",
  "event_name": "TechFest 2024",
  "required_skills": ["JavaScript", "React", "Node.js"],
  "category": "TECH",
  "number_of_positions": 10,
  "deadline": "2024-12-31T23:59:59Z"
}
```

#### Update Event
```http
PUT /api/events/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "CLOSED"
}
```

#### Delete Event
```http
DELETE /api/events/:id
Authorization: Bearer <token>
```

#### Send Bulk Email to Applicants
```http
POST /api/events/:id/email-applicants
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Important Update",
  "message": "Your event details here",
  "target": "SHORTLISTED"  // or "ALL"
}
```

### Application Endpoints

#### Create Application
```http
POST /api/applications
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_id": "uuid-here",
  "message": "I'm interested in this event because..."
}
```

#### Get My Applications
```http
GET /api/applications/my-applications?status=PENDING
Authorization: Bearer <token>
```

#### Get Event Applications (Organizer Only)
```http
GET /api/events/:eventId/applications?status=SHORTLISTED
Authorization: Bearer <token>
```

#### Update Application Status (Organizer Only)
```http
PATCH /api/applications/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "SHORTLISTED"  // PENDING, SHORTLISTED, SELECTED, REJECTED, COMPLETED
}
```

### Student Search Endpoints

#### Search Students
```http
GET /api/students/search?skills=JavaScript&department=CS&year=3&page=1&limit=10
Authorization: Bearer <token>
```

#### Get Student Profile
```http
GET /api/students/:id
Authorization: Bearer <token>
```

### Profile Endpoints

#### Get My Profile
```http
GET /api/profile
Authorization: Bearer <token>
```

#### Update Profile
```http
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "bio": "Passionate developer",
  "department": "Computer Science",
  "year": 3,
  "skills": ["JavaScript", "Python", "React"],
  "interests": ["AI", "Web Development"]
}
```

#### Get My Experiences
```http
GET /api/profile/experiences
Authorization: Bearer <token>
```

### Notification Endpoints

#### Get My Notifications
```http
GET /api/notifications?is_read=false&page=1&limit=20
Authorization: Bearer <token>
```

#### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

#### Mark All as Read
```http
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

### Admin Endpoints

#### Get Pending Events
```http
GET /api/admin/events/pending?page=1&limit=10
Authorization: Bearer <admin-token>
```

#### Get All Events (with filters)
```http
GET /api/admin/events?approval_status=APPROVED
Authorization: Bearer <admin-token>
```

#### Approve Event
```http
PATCH /api/admin/events/:id/approve
Authorization: Bearer <admin-token>
```

#### Reject Event
```http
PATCH /api/admin/events/:id/reject
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Does not meet requirements"  // optional
}
```

## 💬 Socket.IO Events

### Client Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Send Message
```javascript
socket.emit('send_message', {
  receiver_id: 'user-uuid',
  event_id: 'event-uuid',
  message: 'Hello!'
});
```

#### Receive Message
```javascript
socket.on('receive_message', (data) => {
  console.log('New message:', data);
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  receiver_id: 'user-uuid',
  event_id: 'event-uuid',
  is_typing: true
});

socket.on('user_typing', (data) => {
  console.log(`${data.sender_name} is typing...`);
});
```

#### Get Chat History
```javascript
socket.emit('get_chat_history', {
  other_user_id: 'user-uuid',
  event_id: 'event-uuid',
  page: 1,
  limit: 50
});

socket.on('chat_history', (data) => {
  console.log('Messages:', data.messages);
});
```

#### Error Handling
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

## 📁 Project Structure

```
campusconnect-backend/
├── src/
│   ├── config/
│   │   ├── db.js                    # Database connection
│   │   └── syncDb.js                # Database sync utility
│   ├── models/
│   │   ├── index.js                 # Model relationships
│   │   ├── user.model.js            # User model
│   │   ├── profile.model.js         # Profile model
│   │   ├── event.model.js           # Event model
│   │   ├── application.model.js     # Application model
│   │   ├── chat.model.js            # Chat model
│   │   ├── notification.model.js    # Notification model
│   │   └── experience.model.js      # Experience model
│   ├── controllers/
│   │   ├── auth.controller.js       # Auth logic
│   │   ├── admin.controller.js      # Admin logic
│   │   ├── event.controller.js      # Event logic
│   │   ├── application.controller.js # Application logic
│   │   ├── student.controller.js    # Student search logic
│   │   ├── profile.controller.js    # Profile logic
│   │   └── notification.controller.js # Notification logic
│   ├── routes/
│   │   ├── auth.routes.js           # Auth routes
│   │   ├── admin.routes.js          # Admin routes
│   │   ├── event.routes.js          # Event routes
│   │   ├── application.routes.js    # Application routes
│   │   ├── student.routes.js        # Student routes
│   │   ├── profile.routes.js        # Profile routes
│   │   └── notification.routes.js   # Notification routes
│   ├── middleware/
│   │   ├── auth.middleware.js       # JWT authentication
│   │   ├── validate.middleware.js   # Request validation
│   │   └── error.middleware.js      # Error handling
│   ├── services/
│   │   ├── email.service.js         # Email sending
│   │   └── notification.service.js  # Notification creation
│   ├── sockets/
│   │   └── chat.socket.js           # Socket.IO handlers
│   ├── validations/
│   │   ├── auth.validation.js       # Auth validation schemas
│   │   ├── event.validation.js      # Event validation schemas
│   │   ├── application.validation.js # Application validation schemas
│   │   └── profile.validation.js    # Profile validation schemas
│   └── utils/
│       ├── jwt.js                   # JWT utilities
│       └── response.js              # Response utilities
├── app.js                           # Express app setup
├── server.js                        # Server entry point
├── package.json                     # Dependencies
├── .env.example                     # Environment template
└── README.md                        # This file
```

## 📜 Business Rules

### Authentication
- Users must verify email before login
- Only ACTIVE users can access the system
- JWT tokens expire in 7 days (configurable)

### Events
- All events require admin approval before becoming visible
- Events can be: OPEN, CLOSED, or COMPLETED
- Approval status: PENDING_REVIEW, APPROVED, or REJECTED
- Only event owners can update/delete their events
- Deadline must be in the future

### Applications
- Students cannot apply to their own events
- Students cannot apply twice to the same event
- Applications are not allowed after deadline
- Only approved events accept applications
- Status flow: PENDING → SHORTLISTED → SELECTED/REJECTED → COMPLETED

### Chat
- Chat is only enabled for SHORTLISTED or SELECTED applications
- Both student and organizer can chat
- Messages are persisted in database
- Real-time delivery via Socket.IO

### Notifications
Notifications are triggered on:
- Application submission
- Application status change
- Event approval/rejection
- New chat message

### Experience
- Automatically created when application status becomes COMPLETED
- Permanent record of student participation
- Includes event details and completion date

### User Status
- ACTIVE: Normal access
- SUSPENDED: Blocked from all actions
- GRADUATED: Limited access (configurable)

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT-based authentication
- Input validation on all routes
- SQL injection prevention (Sequelize ORM)
- CORS configuration
- Environment variable protection
- Error handling without exposing internals

## 🧪 Testing the API

You can test the API using:
- **Postman** - Import the endpoints
- **Thunder Client** (VS Code extension)
- **cURL** - Command line
- **Insomnia** - API client

### Example: Complete User Flow

1. **Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"John Doe","email":"john@test.com","password":"pass123"}'
```

2. **Verify Email** (check email for OTP)
```bash
curl -X POST http://localhost:5000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","otp":"123456"}'
```

3. **Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

4. **Use the token from login response in subsequent requests**

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Email Not Sending
- Check Gmail App Password is correct
- Ensure 2FA is enabled on Google account
- Check spam folder

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Module Not Found Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📝 License

MIT License - feel free to use this project for learning or production.

## 👥 Support

For issues or questions, please create an issue in the repository or contact the development team.

---

**Built with ❤️ for campus communities**
