# 🎓 CampusConnect API Endpoints

Complete API reference for CampusConnect Backend.

## 📌 Base URL
```
http://localhost:5000/api
```

## 🔑 Authentication
All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Routes

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "STUDENT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "data": {
    "email": "john@example.com"
  }
}
```

### 2. Verify Email
**POST** `/auth/verify-email`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

### 3. Resend OTP
**POST** `/auth/resend-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

### 4. Login
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "email": "john@example.com",
      "role": "STUDENT",
      "status": "ACTIVE"
    }
  }
}
```

### 5. Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

---

## 🎉 Event Routes

### 1. Get All Events (Public)
**GET** `/events`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `category` (TECH | CULTURAL | SPORTS)
- `status` (OPEN | CLOSED | COMPLETED)
- `search` (search in title, description, event_name)

**Example:**
```
GET /events?page=1&limit=10&category=TECH&search=hackathon
```

### 2. Get Event by ID
**GET** `/events/:id`

### 3. Get My Events
**GET** `/events/my-events`

**Headers:** `Authorization: Bearer <token>`

### 4. Create Event
**POST** `/events`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Annual Tech Fest",
  "description": "A 3-day technology festival showcasing innovation",
  "event_name": "TechFest 2024",
  "required_skills": ["JavaScript", "React", "Node.js"],
  "category": "TECH",
  "number_of_positions": 10,
  "deadline": "2024-12-31T23:59:59Z"
}
```

### 5. Update Event
**PUT** `/events/:id`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "status": "CLOSED"
}
```

### 6. Delete Event
**DELETE** `/events/:id`

**Headers:** `Authorization: Bearer <token>`

### 7. Get Event Applications
**GET** `/events/:eventId/applications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (PENDING | SHORTLISTED | SELECTED | REJECTED | COMPLETED)

### 8. Send Bulk Email
**POST** `/events/:id/email-applicants`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "subject": "Important Update",
  "message": "Hello! Here's an important update about the event...",
  "target": "SHORTLISTED"
}
```

---

## 📝 Application Routes

### 1. Create Application
**POST** `/applications`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "event_id": "event-uuid-here",
  "message": "I'm interested in this event because I have experience with..."
}
```

### 2. Get My Applications
**GET** `/applications/my-applications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 10)
- `status` (optional filter)

### 3. Get Application by ID
**GET** `/applications/:id`

**Headers:** `Authorization: Bearer <token>`

### 4. Update Application Status
**PATCH** `/applications/:id/status`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "SHORTLISTED"
}
```

**Status Options:**
- PENDING
- SHORTLISTED
- SELECTED
- REJECTED
- COMPLETED

---

## 🔍 Student Search Routes

### 1. Search Students
**GET** `/students/search`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `skills` (array or comma-separated)
- `interests` (array or comma-separated)
- `department` (string)
- `year` (1-5)
- `search` (search in name/email)
- `page` (default: 1)
- `limit` (default: 10)

**Example:**
```
GET /students/search?skills=JavaScript&skills=Python&department=CS&year=3
```

### 2. Get Student Profile
**GET** `/students/:id`

**Headers:** `Authorization: Bearer <token>`

---

## 👤 Profile Routes

### 1. Get My Profile
**GET** `/profile`

**Headers:** `Authorization: Bearer <token>`

### 2. Update Profile
**PUT** `/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "bio": "Passionate full-stack developer with interest in AI",
  "department": "Computer Science",
  "year": 3,
  "profile_picture": "https://example.com/photo.jpg",
  "skills": ["JavaScript", "Python", "React", "Node.js"],
  "interests": ["AI", "Web Development", "Machine Learning"]
}
```

### 3. Get My Experiences
**GET** `/profile/experiences`

**Headers:** `Authorization: Bearer <token>`

---

## 🔔 Notification Routes

### 1. Get My Notifications
**GET** `/notifications`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `is_read` (true | false)

### 2. Mark as Read
**PATCH** `/notifications/:id/read`

**Headers:** `Authorization: Bearer <token>`

### 3. Mark All as Read
**PATCH** `/notifications/read-all`

**Headers:** `Authorization: Bearer <token>`

### 4. Delete Notification
**DELETE** `/notifications/:id`

**Headers:** `Authorization: Bearer <token>`

---

## 👨‍💼 Admin Routes

All admin routes require `COLLEGE_ADMIN` role.

### 1. Get Pending Events
**GET** `/admin/events/pending`

**Headers:** `Authorization: Bearer <admin-token>`

### 2. Get All Events
**GET** `/admin/events`

**Headers:** `Authorization: Bearer <admin-token>`

**Query Parameters:**
- `approval_status` (PENDING_REVIEW | APPROVED | REJECTED)
- `page`
- `limit`

### 3. Approve Event
**PATCH** `/admin/events/:id/approve`

**Headers:** `Authorization: Bearer <admin-token>`

### 4. Reject Event
**PATCH** `/admin/events/:id/reject`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body (Optional):**
```json
{
  "reason": "Does not meet our event guidelines"
}
```

---

## 🚨 Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Internal Server Error

---

## 💬 Socket.IO Events

### Connection
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'jwt-token' }
});
```

### Client → Server Events

#### send_message
```javascript
socket.emit('send_message', {
  receiver_id: 'user-uuid',
  event_id: 'event-uuid',
  message: 'Hello!'
});
```

#### typing
```javascript
socket.emit('typing', {
  receiver_id: 'user-uuid',
  event_id: 'event-uuid',
  is_typing: true
});
```

#### get_chat_history
```javascript
socket.emit('get_chat_history', {
  other_user_id: 'user-uuid',
  event_id: 'event-uuid',
  page: 1,
  limit: 50
});
```

### Server → Client Events

#### receive_message
```javascript
socket.on('receive_message', (data) => {
  // New message received
});
```

#### message_sent
```javascript
socket.on('message_sent', (data) => {
  // Confirmation that message was sent
});
```

#### user_typing
```javascript
socket.on('user_typing', (data) => {
  // Someone is typing
});
```

#### chat_history
```javascript
socket.on('chat_history', (data) => {
  // Historical messages
});
```

#### error
```javascript
socket.on('error', (error) => {
  // Error occurred
});
```

---

## 📋 Response Examples

### Successful Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // ... response data
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": {
    "events": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "pages": 5
    }
  }
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters"
    }
  ]
}
```

---

## 🔐 Role-Based Access

| Route | Student | Admin | Public |
|-------|---------|-------|--------|
| Register/Login | ✅ | ✅ | ✅ |
| Get Events | ✅ | ✅ | ✅ |
| Create Event | ✅ | ✅ | ❌ |
| Apply to Event | ✅ | ❌ | ❌ |
| Approve Event | ❌ | ✅ | ❌ |
| Search Students | ✅ | ✅ | ❌ |
| Chat | ✅* | ✅* | ❌ |

*Only with shortlisted/selected applicants

---

**Last Updated:** 2024
