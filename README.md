# Smart Campus Event Engine & Ticket Hub

A full-stack college event management, club membership, atomic ticket booking, real-time venue check-in, and analytics web application.

## Tech Stack

- **Frontend:** React.js (Vite), Tailwind CSS, React Router, Axios, Lucide Icons
- **Backend:** Node.js, Express.js, REST APIs, JWT (`jsonwebtoken`), `bcryptjs`
- **Database:** MongoDB (`mongoose` ODM + Aggregation Framework)

## Project Structure

```text
c:\event\
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── app.js              # Express app, CORS, routes, error middleware
│       ├── server.js           # HTTP server & MongoDB connection
│       ├── config/
│       │   ├── db.js           # Mongoose connectDB & status helper
│       │   └── env.js          # Environment configuration
│       ├── controllers/        # Auth, Events, Clubs, Registrations, Analytics
│       ├── db/seed.js          # Seeds users, clubs, events, and registrations
│       ├── middleware/         # JWT auth, role guards, error handler
│       ├── models/             # User, Club, Event, Registration Mongoose models
│       ├── routes/             # Express route definitions
│       └── utils/validators.js # Input validation helpers
└── frontend/
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── src/
        ├── api/                # Axios client (JWT interceptor) & API service wrappers
        ├── components/         # Navbar, EventModal, BookTicketModal, ClubModal, ConfirmModal
        ├── context/            # AuthContext & ToastContext
        └── pages/              # Events, Clubs, MyTickets, CheckInDesk, Analytics, Auth, Profile
```

## MongoDB Collections (`campus_events`)

- `users` — Students, organizers, and admins (`studentId`, `email`, `passwordHash`, `department`, `year`, `role`)
- `clubs` — Campus clubs with embedded `members` references (`name`, `category`, `leadName`, `leadEmail`, `members[]`)
- `events` — Event catalog matching `EVT101`–`EVT104` (`_id`, `title`, `category`, `clubId`, `organizerClub`, `venue`, `date`, `capacity`, `seatsAvailable`, `entryFee`, `tags[]`, `coordinators[]`, `sponsors[]`)
- `registrations` — Booked tickets matching `TICK-2026-001` (`ticketId`, `eventId`, `userId`, `studentId`, `studentName`, `department`, `year`, `checkInStatus`, `paymentDetails`)

---

## Prerequisites

1. **Node.js** (v18+ LTS) and **npm**
2. **MongoDB Server** (running locally on `mongodb://127.0.0.1:27017`)

---

## Installation & Local Setup

### 1. Configure Backend Environment

```powershell
cd c:\event\backend
copy .env.example .env
```

Verify `MONGO_URI=mongodb://127.0.0.1:27017/campus_events` and set a strong `JWT_SECRET` in `backend/.env`.

### 2. Install Backend Dependencies & Seed MongoDB

```powershell
cd c:\event\backend
npm.cmd install
npm.cmd run seed
```

> `npm.cmd run seed` seeds demo users, clubs, memberships, events (`EVT101`–`EVT104`), tags, coordinators, sponsors, and ticket registrations (`TICK-2026-001`–`TICK-2026-004`) into `campus_events`.

### 3. Start the Backend Server

```powershell
cd c:\event\backend
npm.cmd run dev
```

The REST API listens on `http://localhost:5000` (health check: `GET http://localhost:5000/api/health`).

### 4. Configure & Start the Frontend

Open a new terminal:

```powershell
cd c:\event\frontend
copy .env.example .env
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173` in your browser.

---

## Demo Accounts (Seeded by `npm.cmd run seed`)

All seeded accounts use the password: **`Campus@2026`**

| Role | Name | Email | Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | Aarav Sharma | `aarav@college.edu` | Full event/club CRUD, sponsor management, check-in desk, analytics, ticket booking |
| **Organizer** | Riya Sen | `riya@college.edu` | Event/club CRUD, sponsor management, check-in desk, analytics |
| **Student** | Priya Verma (`STU8821`) | `priya@college.edu` | Browse/filter events, atomic ticket booking/cancellation, join/leave clubs, analytics |

---

## REST API Overview

| Group | Endpoints |
| :--- | :--- |
| **Auth** | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `PUT /api/auth/profile` |
| **Events** | `GET /api/events` (filters: `search`, `category`, `freeOnly`, `minSeats`, `tags`, `sort`), `GET /api/events/:id`, `POST /api/events`, `PUT /api/events/:id`, `DELETE /api/events/:id`, `POST /api/events/:id/sponsors`, `DELETE /api/events/:id/sponsors/:sponsorName` |
| **Clubs** | `GET /api/clubs`, `GET /api/clubs/:id`, `POST /api/clubs`, `PUT /api/clubs/:id`, `DELETE /api/clubs/:id`, `POST /api/clubs/:id/join`, `DELETE /api/clubs/:id/leave` |
| **Registrations** | `GET /api/registrations/my`, `GET /api/registrations`, `POST /api/registrations` (atomic `$inc`), `PUT /api/registrations/:id`, `PATCH /api/registrations/:ticketId/checkin`, `DELETE /api/registrations/:id` (restores seat) |
| **Analytics** | `GET /api/analytics/overview` (MongoDB aggregations: revenue per event/club, department participation, turnout rate) |
