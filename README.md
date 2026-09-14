# Orbitask — Task Manager

> A full-stack **PERN** application for organizing projects, sprints, backlogs, and tasks with role-based access control, real-time notifications, and a polished light/dark UI.

---

## Overview

**Orbitask** (Task Manager) is an agile project-management platform. It helps teams plan work across **projects → sprints → tasks**, maintain a shared **backlog**, track **progress**, and enforce **hierarchical permissions** for Admins, Project Managers, Team Leads, and Developers.

The app is secured with **JWT authentication**, **bcrypt** password hashing, and protected REST APIs. Project Managers receive **approval workflows** and **in-app notifications** when Team Leads or Developers request edits to sprints or tasks.

---

## Features

| Area | Highlights |
|------|------------|
| **Project Management** | Create, view, complete, and delete projects (PM-owned) |
| **Sprint Planning** | Create sprints, assign Team Leads, set date ranges, link to active project |
| **Backlog** | Add, browse, and remove backlog items; move tasks into sprints |
| **Task Assignment** | Assign one or more developers to sprint tasks |
| **Progress Tracking** | Update status for projects, sprints, and individual tasks |
| **History** | Role-filtered archive of completed projects, sprints, and tasks |
| **User Management** | Hierarchical user registration with role selection |
| **Approvals** | Pending-edit workflow — PMs approve/reject sprint & task changes |
| **Notifications** | Bell icon with unread count; mark notifications as read |
| **Global Search** | Search across projects, sprints, and backlog from the navbar |
| **Theming** | Light / dark mode toggle with persisted preference |
| **Session Security** | Auto-logout after 10 minutes of inactivity |
| **Forms & Validation** | React Hook Form + Yup schema validation |

---

## Tech Stack

### Frontend (`/Frontend`)
- **React 18** + **Vite**
- **React Router v7** — client-side routing
- **Redux Toolkit** — auth, theme, sidebar, and search state
- **Axios** — HTTP client
- **Bootstrap 5** — responsive UI components
- **React Hook Form** + **Yup** — form handling & validation
- **React Icons** — iconography

### Backend (`/Backend`)
- **Node.js** + **Express 5**
- **PostgreSQL** (`pg`) — relational data store
- **JSON Web Tokens (JWT)** — stateless authentication
- **bcrypt** — password hashing
- **CORS** + **body-parser** — API middleware

### Database
- **PostgreSQL** database: `task-manager`

---

## Role-Based Access

| Role | Code | Capabilities |
|------|------|--------------|
| **Admin** | `AD` | View all active projects; create Project Managers |
| **Project Manager** | `PM` | Create/delete projects & sprints; approve edit requests; full project visibility |
| **Team Lead** | `TL` | View assigned projects/sprints; create Developers; request sprint/task edits |
| **Developer** | `DEV` | View assigned sprints & tasks; update task status; request task edits |

**User creation hierarchy:** Admin → PM → TL → DEV

---

## Project Structure

```
TaskManager/
├── Backend/
│   ├── index.js          # Express server & all REST endpoints
│   ├── package.json
│   └── .env              # JWT_SECRET, DB_PASSWORD (not committed)
│
└── Frontend/
    ├── src/
    │   ├── components/   # Navbar, Sidebar, ProtectedRoute, SessionManager
    │   ├── features/     # Redux slices (auth, theme, sidebar, search)
    │   ├── pages/        # Home, Projects, Sprints, Backlog, History, Login, etc.
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [PostgreSQL](https://www.postgresql.org/) (v14+)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/TahnanAmir/Orbitask.git
cd TaskManager
```

### 2. Set up the database

Create a PostgreSQL database named `task-manager`, then run the schema below:

```sql
CREATE DATABASE "task-manager";

-- Connect to task-manager, then:

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  age INTEGER,
  phone_number VARCHAR(20) UNIQUE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('AD', 'PM', 'TL', 'DEV'))
);

CREATE TABLE project (
  "project-id" SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  "user-id" INTEGER REFERENCES users(id),
  description TEXT,
  active_sprint INTEGER,
  status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE sprint (
  sprint_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  completion_date DATE,
  project_id INTEGER REFERENCES project("project-id"),
  team_lead INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE backlog (
  task_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE sprint_tasks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  developer INTEGER REFERENCES users(id),
  sprint_id INTEGER REFERENCES sprint(sprint_id),
  status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE pending_edits (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  entity_id INTEGER NOT NULL,
  new_data JSONB,
  requested_by INTEGER REFERENCES users(id),
  decided_by INTEGER REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending'
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'unread',
  related_edit_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Configure environment variables

Create `Backend/.env`:

```env
JWT_SECRET=your_secret_jwt_key
DB_PASSWORD=your_postgres_password
```

### 4. Install dependencies

```bash
# Backend
cd Backend
npm install
npm install bcrypt cors body-parser   # if not already present

# Frontend
cd ../Frontend
npm install
npm install axios @reduxjs/toolkit react-redux   # if not already present
```

### 5. Run the application

```bash
# Terminal 1 — Backend (port 3000)
cd Backend
node index.js

# Terminal 2 — Frontend (port 5173)
cd Frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Development Notes

- The frontend expects the API at **`http://localhost:3000`**.
- JWT tokens expire after **1 hour**; the client also enforces a **10-minute inactivity** logout.
- Theme and sidebar collapse state persist in `localStorage`.
- The first Admin user must be seeded directly in the database.

---

## Author

If you found this useful, consider giving the repo a ⭐ on GitHub!
