# MUNAI — Model United Nations Management Platform

MUNAI is a full-stack platform designed to digitize, streamline, and enhance the Model United Nations (MUN) experience. It provides an integrated environment for conference organizers, secretariat teams, chairs, and delegates to manage conferences, committees, and sessions with real-time coordination, AI-assisted evaluation, and structured workflows.

---

## Core Objective

Eliminate inefficiencies in traditional MUN management by centralizing all operations—conference setup, committee management, delegate interaction, and evaluation—into a single, intelligent system.

---

## Key Features

### 1. Authentication & User System
- Unified Sign In / Sign Up flow
- Persistent sessions (users remain logged in)
- Role-based access control:
  - Secretary General (Sec Gen)
  - Secretariat Team
  - Chair
  - Delegate
- User profiles include:
  - Bio
  - MUN experience
  - Conferences attended
  - Awards (AI-structured)
  - Social media links
  - Profile image

---

### 2. Role Hierarchy & Permissions

#### Secretary General (Sec Gen)
- Full oversight of the entire conference
- View-only access to all committees
- Can configure:
  - Events
  - Committees
  - Registration questions
- Can approve chairs
- Can view all data (delegates, chairs, uploads, activity)

#### Secretariat Team
- Full visibility across system
- Cannot edit core structures
- Can:
  - Push official updates
  - Coordinate with Sec Gen

#### Chairs
- Full control over assigned committees
- Must be approved by Sec Gen / Secretariat
- Can:
  - Manage agenda
  - Control timers
  - Evaluate delegates
  - Upload files
  - Define crisis triggers
  - Configure committee-specific features

#### Delegates
- Limited to committee-specific access
- Cannot modify system data
- Participate in sessions, submit speeches, and receive scores

---

### 3. Conference & Committee System

#### Conference Types
- Full Conferences (Sec Gen-led)
- Standalone Committees (Chair-led)

#### Committee Types
- Standard Committees
- Crisis Committees (always active crisis mode)
- Specialized Committees (custom logic like ICJ, IPC)

#### Data Persistence
- Committees persist until:
  - Explicitly closed, or
  - Conference is ended

---

### 4. Navigation & UI System

- Right-side vertical tab navigation (persistent)
- Glassmorphism design (frosted glass UI)
- Color system:
  - Primary: `#EFEEEA`
  - Secondary: `#145D6B`
  - Tertiary: `#BC5928`
- Responsive layout across all devices
- Smooth animations and transitions

---

### 5. Discover System (Events)

- Browse upcoming conferences
- View:
  - Posters
  - Dates
  - Committees
  - Location
  - Payment details
- Optional public profiles of:
  - Chairs
  - Delegates
  - Sec Gens

---

### 6. Registration System

- Code-based entry only (no public links)
- Signed-in users can:
  - Register using name + email
  - Answer up to 3 custom questions
- Non-signed-in users:
  - View-only access

---

### 7. Committee Engine

#### Initialization (Chair-controlled)
- Agenda must be set first
- Committee files uploaded
- Country matrix defined
- Delegates must select countries (no manual entry)

#### Live Features
- Global conference clock
- Timers:
  - General Speakers List (GSL)
  - Moderated Caucus
  - Unmoderated Caucus
  - Crisis Timer (separate)
- Floating timer control panel
- Dropdown session type selector
- Auto-reset timers linked to speakers list

---

### 8. AI-Powered Evaluation

After each speech:
1. Delegate submits speech
2. AI evaluates and scores out of 10
3. Chair provides qualitative feedback
4. Final score stored in delegate scoresheet

---

### 9. Crisis System

#### Standard Committees (Optional Crisis Mode)
- Enabled by Secretariat
- Includes:
  - Crisis timer
  - Crisis triggers
  - Expanded speakers list
- Crisis operates in isolation (no long-term effect)

#### Crisis Committees
- Always active
- Unlimited triggers
- Continuous narrative progression

---

### 10. Specialized Committees

- AI-generated custom modules
- Examples:
  - ICJ → Courtroom system
  - IPC → Press release system
- Up to 2 custom tabs added dynamically
- Fully integrated with base system (timers, updates, AI)

---

### 11. Chair Portal

- Full committee control
- Notes page (AI-accessible)
- Speaker tracking
- Score management
- File uploads
- Crisis management tools

---

### 12. Real-Time Updates

- No manual refresh required
- All updates propagate instantly:
  - Secretariat announcements
  - Chair uploads
  - Committee changes

---

### 13. Exit & End Logic

#### Exit
- Leaves session
- Data remains intact in dashboard

#### End (Critical Action)
- Requires:
  - Confirmation
  - Email verification

#### Conference End
- Available only on Day 3
- Triggers 48-hour download window

#### Standalone Committee End
- Triggered by Head Chair
- 24-hour download window

---

### 14. Data Export

- Full conference or committee data downloadable:
  - Manual selection
  - Complete ZIP archive

---

### 15. Database Integrity

- Strict relational validation
- Prevents foreign key violations
- Ensures:
  - Committees exist before sessions
  - No orphaned records
  - Safe insert/update operations

---

## Technology Philosophy

MUNAI is built around:
- Real-time systems
- Role-based architecture
- AI-assisted decision support
- Strict data integrity
- Scalable modular design

---

## Target Users

- MUN Conference Organizers
- Secretariat Teams
- Committee Chairs
- Student Delegates

---

## Future Scope

- Advanced AI moderation assistance
- Speech pattern analytics
- Delegate ranking systems
- Cross-conference profiles
- Mobile optimization

---

## License

Specify license here (e.g., MIT, Apache 2.0).

---

## Author

Developed by Vihaan Harrison
