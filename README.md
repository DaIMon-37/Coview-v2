# CoView — Watch Together Platform

A real-time synchronized watch party platform. Create rooms, invite friends, watch videos together, and chat live.

## Stack

- **Frontend**: React + Vite + Tailwind CSS + Socket.IO Client
- **Backend**: Node.js + Express + Socket.IO + Supabase (PostgreSQL) + JWT

---

## Setup

### 1. Database (Supabase)

Create a Supabase project at https://supabase.com and run this SQL:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  email text not null unique,
  password text not null,
  created_at timestamptz default now()
);

create table parties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_id uuid references users(id),
  title text default 'Watch Party',
  privacy text default 'public',
  video_url text,
  created_at timestamptz default now()
);

create table party_members (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  joined_at timestamptz default now(),
  unique(party_id, user_id)
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  party_id uuid references parties(id) on delete cascade,
  user_id uuid references users(id),
  message text not null,
  created_at timestamptz default now()
);
```

### 2. Environment Variables

Copy `backend/.env` and fill in your values:

```env
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
JWT_SECRET=your_random_secret_string
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies

```bash
# From project root
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 4. Run

```bash
# From project root (runs both frontend and backend)
npm run dev

# Or separately:
cd backend && npm run dev    # http://localhost:5000
cd frontend && npm run dev   # http://localhost:5173
```

---

## Features

- **Authentication** — Register, login, JWT sessions
- **Watch Rooms** — Create/join rooms with 6-character codes
- **Real-Time Sync** — Host controls play/pause/seek, all viewers sync instantly
- **Live Chat** — Persistent messages via Supabase, real-time via Socket.IO
- **User Presence** — See who's online in the room
- **Host Transfer** — Automatic host migration when host disconnects
- **Video Queue** — Add YouTube videos to the queue
- **Mood Playlists** — Curated video recommendations by mood
- **Guest Mode** — Browse without an account

---

## How to Use

1. **Register** at `/signup`
2. **Create a party** at `/create` — paste a YouTube URL, get a 6-char room code
3. **Share the code** with friends
4. **Friends join** at `/join` — enter the code
5. **Watch together** — host controls the video, everyone stays in sync
6. **Chat** in the sidebar

---

## Architecture

```
frontend/src/
├── services/
│   ├── api.js          # Axios API client
│   └── socket.js       # Socket.IO connection manager
├── context/
│   └── AppContext.jsx  # Global state + socket event handlers
└── pages/
    ├── Login.jsx        # Real JWT auth
    ├── Signup.jsx       # Real registration
    ├── CreateParty.jsx  # Creates room via API + joins socket
    ├── JoinParty.jsx    # Validates code via API + joins socket
    ├── ViewingScreen.jsx      # Video player with socket sync
    └── ViewingScreenChat.jsx  # Video + live chat

backend/src/
├── controllers/    # HTTP request handlers
├── routes/         # Express routes
├── services/
│   ├── RoomManager.js  # In-memory room state
│   ├── VideoService.js # Video state management
│   └── SyncService.js  # Drift detection & correction
└── socket/
    ├── handlers/   # Socket event handlers
    └── middleware/ # Socket JWT auth
```
