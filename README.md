# Free Fire Tournament Management System

A professional, full-stack esports tournament management website designed to host and manage large-scale Free Fire tournaments with 600 players across 10 dedicated battle rooms.

Features room-specific QR registration, real-time match countdowns, instant match start controls, referee kill tracking, tie-breaking logic, and automatic leaderboard generation.

---

## 🏆 Key Features

1. **Room QR Code Registration System**:
   - 10 distinct QR codes dynamically generated for Rooms 1 through 10.
   - Automatically binds scanning players to their respective room registration page (`/register/room-X`).
   - Strict room capacity enforcement: max 60 players per room (600 total capacity).
   - High-resolution PNG and SVG QR code downloads with single-click batch printing for venue check-in desks.

2. **Match Command Center & Live Battle Timers** *(Highlight Feature)*:
   - **START MATCH button**: Instantly starts the live battle, launches the 20-minute digital countdown clock, and broadcasts live phase alerts.
   - **SET MATCH TIME**: Schedule matches with custom dates and times or one-click presets ("In 5 mins", "In 15 mins", "Tonight 8:00 PM").
   - Live match status broadcast across all views (Scheduled -> Starting Soon -> Live In Progress -> Paused -> Completed).
   - Room-specific or all-rooms championship match triggers.

3. **Player Registration & Digital Combat Pass**:
   - Strict validation: Player Real Name, Free Fire IGN, validated Free Fire UID (6-16 chars), mobile contact, and passwords.
   - Prevention of duplicate Free Fire UIDs and duplicate mobile registrations.
   - Passwords hashed with bcrypt.
   - Generates an official, printable digital Combat Pass with barcode and verified QR code upon registration.

4. **Player Login & Personal Dashboard**:
   - Secure login using registered mobile number or Free Fire UID + website password.
   - Displays Player Name, IGN, UID, Registration ID, Assigned Room, Total Kills, Current Rank, and Match Status.
   - Status indicators: Active (Green), Eliminated (Yellow), Disqualified (Red with reason).

5. **Manual Referee Kill Scoring & Quick Terminal**:
   - Official score storage: stores total kills as the official score (replacing old totals, not compounding).
   - Mandatory audit logging: records previous kills, new kills, referee username, timestamp, and update reason.
   - Fast **Quick Kill Updater** tool for rapid live score tallying without navigating away.

6. **Automated Leaderboard & Winner Selection**:
   - Real-time ranking calculated dynamically from total verified kills in descending order.
   - High-impact Top 3 Podium (Gold #1, Silver #2, Bronze #3).
   - Disqualified players are excluded from eligible winner ranks and podiums while preserving their kill logs.
   - Eliminated players retain their kills and standing.
   - Filterable by overall tournament or individual rooms.

7. **Reports & Data Export**:
   - Export full 600-player roster to CSV (passwords excluded).
   - Printable room referee check-in sheets with signature columns and checkboxes.
   - Export official leaderboard standings to CSV.

---

## 🚀 Quick Start & Local Development

### 1. Installation
Install all dependencies:
```bash
npm install
```

### 2. Running the Full-Stack Application
Start the unified full-stack development server (Express backend + Vite React SPA on port 3000):
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

### 3. Default Admin Credentials
- **Username**: `admin`
- **Password**: `password123`

---

## 🛠️ Project Structure

```
├── data/
│   └── tournament_data.json       # Durable JSON storage with atomic writes
├── server/
│   ├── middleware/
│   │   └── auth.ts                # Admin & Player authentication middleware
│   ├── models/
│   │   └── index.ts               # MongoDB Mongoose schemas & TypeScript interfaces
│   ├── routes/
│   │   ├── admin.ts               # Admin dashboard, match controls & kill APIs
│   │   ├── auth.ts                # Registration, login & player profile APIs
│   │   └── tournament.ts          # Public stats, rooms, match timer & leaderboard
│   └── db.ts                      # Persistent database engine with audit logs
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx     # Admin panel container
│   │   ├── AdminReports.tsx       # CSV exports & printable referee rosters
│   │   ├── DisqualifyModal.tsx    # Disqualification dialog with mandatory reason
│   │   ├── Header.tsx             # Esports top navigation & live match ticker
│   │   ├── LeaderboardView.tsx    # Live podium & ranked leaderboard table
│   │   ├── LiveMatchBanner.tsx    # Match timer, Start Match & Schedule buttons
│   │   ├── MoveRoomModal.tsx      # Player room transfer modal
│   │   ├── PlayerDashboard.tsx    # Player portal & stats
│   │   ├── PlayerManagement.tsx   # Player table, search, filters & actions
│   │   ├── PlayerPassCard.tsx     # Printable Combat Pass with verified QR
│   │   ├── PublicHome.tsx         # Tournament hub with room cards & radar
│   │   ├── QRManagement.tsx       # 10 room QR codes with PNG/SVG downloads
│   │   ├── QuickKillUpdater.tsx   # Referee rapid kill scoring terminal
│   │   ├── RegisterPage.tsx       # Room-bound registration form
│   │   ├── ScheduleMatchModal.tsx # Match time scheduler
│   │   ├── StartMatchModal.tsx    # Instant match launch modal
│   │   ├── TournamentSettingsView.tsx # Settings, seed demo & reset data
│   │   └── UpdateKillsModal.tsx   # Manual kill score correction modal
│   ├── services/
│   │   └── api.ts                 # Frontend API client
│   ├── types/
│   │   └── tournament.ts          # Common TypeScript interfaces
│   ├── App.tsx                    # Main router & modal controller
│   ├── index.css                  # Tailwind CSS v4 & esports styling
│   └── main.tsx                   # React root entry
├── server.ts                      # Express server with Vite middleware integration
├── package.json
└── tsconfig.json
```

---

## 🧪 Testing Instructions

1. **Verify Match Controls**:
   - Click **Admin Panel** in the top navigation (Login: `admin` / `password123`).
   - Click the prominent **START MATCH NOW** button. Notice the live battle timer start counting down from 20:00 with the live indicator pulsing.
   - Click **SET MATCH TIME** and select a preset (e.g. "In 15 Mins") to schedule an upcoming match.
2. **Seed Demo Tournament**:
   - Go to **Admin Panel > Settings**.
   - Click **"Seed 50 Demo Players With Kills"**. This populates realistic players across all 10 rooms with kills, active status, eliminations, and disqualifications.
3. **Verify Leaderboard & Automatic Podium**:
   - Click **Leaderboard** in navigation.
   - Observe the top 3 players displayed on the Gold, Silver, and Bronze podium.
   - Verify that disqualified players are marked "DQ (Ineligible)" and not awarded winner positions.
4. **Verify Room QR Codes**:
   - Navigate to **Room QRs**.
   - Inspect the 10 rooms with their dynamic QR codes, capacities, PNG/SVG download buttons, and print options.
   - Click **"Open Room Register"** on Room 3. Notice the registration page opens automatically pre-bound to Room 3.
5. **Test Manual Kill Scoring**:
   - In Admin Panel, open the **Quick Kill Updater** tab.
   - Search for a player, change their kills from 5 to 8, add an audit note, and save.
   - Check the **Live Kill Score Audit Feed** to verify the audit log entry is recorded with previous kills, updated kills, reason, and referee name.
