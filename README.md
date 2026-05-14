# Project Kioku

Project Kioku is a browser-based memory and reaction game built with a full-stack JavaScript architecture using Node.js, Express, MongoDB, and vanilla frontend technologies.

The project was designed as a performance-focused cognitive game where players memorize increasingly complex sequences while competing for higher scores and tracking gameplay statistics over time.

Unlike a simple frontend-only game, Project Kioku includes:
- JWT authentication
- protected backend APIs
- persistent user accounts
- leaderboard system
- gameplay analytics
- session history tracking
- MongoDB database integration

The interface uses a cyber-inspired visual style with responsive layouts, animated feedback, dynamic game states, and account-based progression.

---

## Features

### Authentication System
- User registration and login
- JWT-based authentication
- Protected routes using middleware
- Persistent login sessions
- Guest mode support

### Gameplay System
- Progressive memory sequence gameplay
- Dynamic grid scaling
- Increasing difficulty
- Lives system
- Score tracking
- Real-time visual feedback
- Session progression mechanics

### User Data & Analytics
- Best score tracking
- Highest level reached
- Average reaction time
- Accuracy calculation
- Games played statistics
- Session history storage

### Leaderboard
- Global leaderboard support
- Persistent score storage
- Ranked player performance

---

## Tech Stack

### Frontend
- HTML5
- CSS3
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB
- Mongoose

### Authentication & Security
- JWT (jsonwebtoken)
- bcryptjs
- Express middleware

### Development Tools
- Nodemon
- Thunder Client
- MongoDB Compass
- VS Code

---

## Project Structure

```text
Project Kioku/
│
├── config/
│   └── db.js
│
├── controllers/
│   ├── authController.js
│   ├── sessionController.js
│   └── userController.js
│
├── middleware/
│   ├── authMiddleware.js
│   └── errorMiddleware.js
│
├── models/
│   ├── User.js
│   └── GameSession.js
│
├── routes/
│   ├── authRoutes.js
│   ├── sessionRoutes.js
│   └── userRoutes.js
│
├── index.html
├── style.css
├── script.js
│
├── server.js
├── package.json
├── .env
└── README.md
```

---

## How the Backend Works

The backend follows a layered Express architecture:

### Routes
Routes define API endpoints and connect requests to controllers.

Example:
```js
router.post("/login", login);
```

### Controllers
Controllers contain the main business logic:
- user registration
- login validation
- session saving
- leaderboard generation
- analytics handling

### Middleware
Middleware handles reusable request processing:
- JWT verification
- route protection
- centralized error handling

### Models
Mongoose models define MongoDB document structures and validation rules.

### Database Layer
MongoDB stores:
- user accounts
- gameplay sessions
- analytics data
- leaderboard statistics

---

## Authentication Flow

1. User signs up or logs in
2. Backend validates credentials
3. JWT token is generated
4. Token is returned to frontend
5. Frontend stores token in localStorage
6. Protected requests send:
```text
Authorization: Bearer <token>
```
7. Middleware verifies token before protected routes execute

---

## Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project-kioku
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```env
MONGO_URI=mongodb://localhost:27017/projectkioku
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_ORIGIN=http://127.0.0.1:5500
```

### 4. Start MongoDB

Make sure MongoDB is running locally.

### 5. Start Backend Server

```bash
npm run dev
```

### 6. Launch Frontend

Open `index.html` using VS Code Live Server.

---

## API Overview

### Auth Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### User Routes

| Method | Route | Description |
|---|---|---|
| GET | `/api/users/profile` | User profile |
| GET | `/api/users/leaderboard` | Global leaderboard |

### Session Routes

| Method | Route | Description |
|---|---|---|
| POST | `/api/sessions` | Save gameplay session |
| GET | `/api/sessions/history` | Session history |

---

## Design Goals

This project was built to practice:
- full-stack architecture
- REST API design
- authentication systems
- MongoDB integration
- request lifecycle understanding
- backend organization
- frontend/backend communication

The project also focuses heavily on code readability and modular structure to make future scaling easier.

---

## Future Improvements

Possible future additions:
- multiplayer support
- difficulty presets
- sound system
- profile avatars
- achievements system
- WebSocket real-time leaderboard
- deployment with Render/Vercel
- mobile optimization
- refresh token authentication

---


## Author

Built as a full-stack learning project focused on backend architecture, authentication systems, and interactive gameplay mechanics.