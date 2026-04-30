# ⚡ TaskForge

![TaskForge Banner](https://via.placeholder.com/1200x600/022c22/fbbf24?text=TaskForge+-+Modern+Project+Management)

TaskForge is a premium, full-stack project management application built for modern teams. It features a stunning "glassmorphism" UI, interactive drag-and-drop Kanban boards, real-time analytics, and role-based access control.

## ✨ Features

- **Modern UI/UX**: Beautiful dark green (emerald/forest), ivory, and gold gradient theme with glassmorphism effects and fluid animations.
- **Interactive Kanban Board**: Drag-and-drop tasks between To Do, In Progress, and Completed columns.
- **Advanced Dashboard Analytics**:
  - Task completion timeline (Line Chart)
  - Status distribution (Donut Chart)
  - Project completion (Circular Progress)
  - Team productivity tracking and activity timelines
- **Calendar View**: Visualize tasks by due date on a monthly grid.
- **Role-Based Access Control (RBAC)**: 
  - **Admins** can manage projects, team members, and view all tasks.
  - **Members** have focused access to their assigned projects and tasks.
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing.

## 🛠️ Technology Stack

**Frontend**
- Next.js (App Router)
- Tailwind CSS v4 (Custom Design System)
- Lucide React (Icons)
- Context API (State Management)

**Backend**
- Node.js & Express.js
- SQLite (`better-sqlite3`)
- JSON Web Tokens (JWT)
- bcrypt (Password Hashing)

---

## 🚀 Getting Started

Follow these instructions to get the project running locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:

```bash
cd backend
npm install
```

Start the backend server:
```bash
node server.js
```
*The backend will automatically create the SQLite database (`taskforge.db`), seed it with demo data, and run on `http://localhost:5000`.*

### 2. Frontend Setup

Open a **new** terminal and navigate to the `frontend` directory:

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend` directory (optional, it defaults to localhost:5000):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Start the frontend development server:
```bash
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

---

## 🔑 Demo Credentials

The database is automatically seeded with the following demo accounts on the first run:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@taskforge.com` | `admin123` |
| **Member**| `john@taskforge.com` | `member123` |

You can use these credentials to log in, or use the quick "Demo" buttons on the login screen.

---

## 📂 Project Structure

```text
TaskForge/
├── backend/                  # Express.js REST API
│   ├── config/               # Database and configuration setup
│   ├── middleware/           # Auth and RBAC middleware
│   ├── routes/               # API endpoints (auth, projects, tasks, users)
│   └── server.js             # Backend entry point
│
└── frontend/                 # Next.js Application
    ├── src/
    │   ├── app/              # Next.js App Router pages (Dashboard, Tasks, Calendar, etc.)
    │   ├── components/       # Reusable UI components (Sidebar, AppLayout, Charts)
    │   ├── contexts/         # React Context providers (AuthContext)
    │   └── lib/              # Utility functions and API client
    ├── public/               # Static assets
    └── tailwind.config.ts    # Tailwind CSS configuration
```

## 📜 License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it as you see fit.
