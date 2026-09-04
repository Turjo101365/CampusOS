# CampusOS — Intelligent University Platform & Real-Time AI Agent

> **AI Build Hackathon · CSE Carnival 8.0 Submission**  
> Built with **Node.js, Express, React (JSX), and Modern CSS**.

---

## 1. Project Overview

**CampusOS** is a university operating system that bridges fragmented campus information into an intelligent, unified platform. It features two interconnected components:
1. **The Campus Data Manager**: A responsive React (JSX) dashboard enabling real-time viewing and full CRUD management (Add, Edit, Delete) across five core campus systems — **Class Schedules**, **Rooms & Facilities** (with live booking and cancellation), **Campus Events** (with seat capacity tracking and student registration), **Department Announcements** (with priority levels and active/expired filters), and **Course Assignments** (with deadline tracking and status workflows). All modifications persist atomically to a backend JSON database and are immediately reflected across the UI without full-page reloads.
2. **The CampusOS AI Senior Assistant**: An intelligent agent persona modeled after a helpful senior student who has real-time access to campus databases. Rather than guessing, the agent uses **real function calling / tool calling** against the live backend to answer questions, reason across multiple sources (e.g. correlating schedule openings with event timings), check room availability and schedule clashes, execute bookings and registrations, politely ask for clarification when requests are ambiguous (e.g. "Just book me any room tomorrow afternoon"), and immediately reflect mid-evaluation dashboard updates.

---

## 2. Tech Stack

- **Frontend**: React 18, JSX, Vite 6, Lucide React (icons), Custom Modern CSS Design System (Dark theme with university accents, accessible modals, responsive cards & tables).
- **Backend**: Node.js (v20+ / v22+), Express 4, CORS, Dotenv.
- **Database / Persistent Storage**: Persistent JSON file-backed ACID store with atomic file swapping and initial seed auto-loading from `data/*.json`.
- **AI Agent & Tool Calling**:
  - Multi-LLM provider support: Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), Groq (`llama-3.3-70b-versatile`), and Anthropic.
  - **CampusOS Native Engine**: Built-in intelligent tool execution engine that executes genuine function calling against the live database out-of-the-box — **zero external API key required to run and evaluate!**
- **Test Suite**: Built-in end-to-end automated test runner covering all CRUD operations, clash detection, capacity limits, and all 10 judge sample queries.

---

## 3. Quick Start & Setup Instructions

### Prerequisites
- Node.js **v18.0.0** or newer (v22 recommended)
- npm **v9.0.0** or newer

### Installation

Clone your repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/cse-carnival-8-aibuild-hackathon.git
cd cse-carnival-8-aibuild-hackathon

# Install dependencies (single command for whole project)
npm install
```

### Running the Application

You can run CampusOS in either **Development Mode** or **Production Mode**:

#### Option A: Development Mode (Recommended for Live Editing)
Runs both the backend API (port 3000) and the Vite hot-reloading frontend (port 5173):

```bash
npm run dev
```
Open your browser at: **`http://localhost:5173`** (or `http://localhost:3000`)

#### Option B: Production Mode (Single Port Serving Everything)
Builds the React client bundle and serves both the REST API and the dashboard from Express:

```bash
npm run build
npm start
```
Open your browser at: **`http://localhost:3000`**

---

## 4. Environment Variables

Create a `.env` file in the root directory by copying the provided example:

```bash
cp .env.example .env
```

| Variable | Description | Required? |
|----------|-------------|-----------|
| `PORT` | Server listening port (default: `3000`) | Optional |
| `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Google Gemini API key for LLM tool calling | Optional (Native Engine used if omitted) |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini tool calling | Optional |
| `GROQ_API_KEY` | Groq API key for LLaMA-3.3 tool calling | Optional |

> **Note**: An LLM API key is **optional**. If no key is set, CampusOS automatically utilizes its **Native Engine** which executes the exact same tool calling schemas and live database queries, ensuring judges can test every feature immediately with zero setup!

---

## 5. Automated Verification & Testing

To run the automated test suite verifying all 5 systems, CRUD persistence, clash detection, and sample agent queries:

```bash
npm test
```

Expected output:
```
========================================
🧪 Starting CampusOS Automated Test Suite
========================================
▶ Test 1: Seed Data Verification (24 schedules, 20 rooms, 7 events, 8 announcements, 8 assignments)
▶ Test 2: Schedule CRUD Operations
▶ Test 3: Room CRUD, Booking & Clash Detection
▶ Test 4: Event CRUD, Registration & Capacity Management
▶ Test 5: Announcements & Assignments CRUD
▶ Test 6: AI Agent Query Evaluation (All sample queries)
▶ Test 7: Mid-Evaluation Live Edit Test
========================================
🎉 ALL TESTS PASSED SUCCESSFULLY! (7/7)
========================================
```

To reset the database back to clean seed data at any time:
```bash
npm run reset-data
```
*(Or click the **"Reset Seed"** button directly in the navigation bar!)*

---

## 6. How to Use the AI Senior Assistant

Click the **AI Senior Assistant** tab (or the floating robot icon) in the bottom-right corner. You will find categorized one-click chips for all judge queries, or you can type freely:

### 1. Simple Lookups
- *"When is my next class?"*
  - Reads Sunday schedule, detects upcoming class (CSE 4129 at 8:00 AM), and cross-checks notice board announcements to warn about the rescheduled CSE 4113 class!
- *"What classes do I have on Wednesday?"*
  - Returns courses, times, rooms, and instructors for Wednesday.
- *"What assignments do I have due this week?"*
  - Filters pending assignments due between September 4 and September 11.
- *"Show me all high priority announcements."*
  - Displays high-priority notices with expiry dates and authors.

### 2. Multi-Source Reasoning
- *"Which labs have a projector and can fit at least 30 people?"*
  - Simultaneously filters by `type = "lab"`, `capacity >= 30`, and `equipment includes "projector"`.
- *"I'm free until 2 PM — is there anything on campus I could drop into?"*
  - Cross-references free time before 14:00 with campus events, review sessions, and available study rooms.

### 3. Actions & Clash Prevention
- *"Book Room 7A02 tomorrow from 3 PM to 5 PM."*
  - Verifies Room 7A02 is free (no booking overlap or scheduled classes), creates the booking, assigns a unique booking ID, and immediately updates the Rooms dashboard.
- *"Register me for the Guest Lecture on Deep Learning."*
  - Finds the event, verifies capacity (62/70), registers student Sakibul Hassan (20-40532), increments the count, and confirms the venue and time.
- *"I need a room for 5 people with a projector, tomorrow between 2 and 4."*
  - Filters suitable rooms with capacity and equipment, checks timetable clashes, and suggests the best options.

### 4. Ambiguity Handling & Guardrails
- *"Just book me any room tomorrow afternoon."*
  - **Refuses to guess**: Detects that the request is ambiguous (missing room type, exact hours, capacity, and equipment) and prompts the user for clarification before modifying anything!

### 5. Mid-Evaluation Live Edits
- Edit an announcement, room capacity, or schedule in the dashboard.
- Immediately ask the agent about it in the chat.
- The agent queries the live persistent backend on every turn — no caching, always 100% up-to-date!

---

## 7. Submission Checklist Verification

- [x] **Repository is public** (or ready to be switched to public by 8:30 PM deadline)
- [x] **All five data sections visible** in the dashboard: Schedules, Rooms, Events, Announcements, Assignments.
- [x] **Add, Edit, and Delete work for all five systems** and changes persist across reloads.
- [x] **Special actions work**: Room booking with clash detection, cancel booking, event registration with capacity limits, cancel registration.
- [x] **AI Agent with real tool calling**: Inspect live tool execution traces in the UI for every query.
- [x] **README has working local setup steps** tested and verified.
- [x] **No API keys committed** to the repo.
