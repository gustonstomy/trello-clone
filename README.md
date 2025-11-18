# Trello Clone

A full-featured Trello clone built with Next.js 14, Supabase, and TypeScript.

## Features

-  **Authentication**: Sign up, sign in, stay logged in, and log out
-  **Organizations**: Create and manage multiple organizations
-  **Organization Invites**: Invite users via email with secure invite links
-  **Boards**: Create and manage boards within organizations
-  **Lists & Cards**: Organize tasks with lists and cards
-  **Drag & Drop**: Reorder lists and move cards between lists
-  **Card History**: Track all card actions with activity logs
-  **Real-time Updates**: Live collaboration with Supabase Realtime
-  **Role-Based Access**: Owner, Admin, and Member roles

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Backend**: Supabase (PostgreSQL + Realtime + Auth)
- **State Management**: Zustand + React Query
- **Drag & Drop**: @dnd-kit
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript (strict mode)

## Prerequisites

- Node.js 18+ and npm
- A Supabase account

## Setup Instructions

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd trello-clone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once your project is ready, go to **Settings** > **API**
3. Copy your **Project URL** and **anon/public key**
4. Go to the **SQL Editor** and run the complete database schema from the project setup phase

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Getting Started

1. **Sign Up**: Create a new account at `/auth/signup`
2. **Create Organization**: Click "Create Organization" in the dashboard
3. **Invite Members**: Use the "Invite Members" button to add team members
4. **Create Boards**: Add boards to organize your projects
5. **Add Lists & Cards**: Create lists and cards, then drag and drop to organize

### Invite Flow

1. Admin/Owner invites a user by email
2. System generates a unique invite link
3. User receives the link and clicks it
4. User must be logged in with the invited email to accept
5. User joins the organization with the specified role

### Keyboard Shortcuts

- **Enter**: Save changes in inline editors
- **Escape**: Cancel inline editing

## Project Structure