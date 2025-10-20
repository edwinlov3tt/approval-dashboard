# Client Approval Dashboard

A standalone web application for managing campaign approvals, built with Vite + React + TailwindCSS.

## Features

- **Dashboard**: Overview with stats cards and recent activity table
- **Campaigns**: Manage campaigns with table and kanban board views
- **Calendar**: Visual calendar view of campaign timelines
- **Profile**: User profile settings with vacation mode
- **Authentication**: Simple login system (email/password)

## Tech Stack

- **Frontend**: Vite + React 18 + React Router
- **Styling**: TailwindCSS with Meta design system
- **State**: React Context API
- **Data**: Mock data (ready for backend integration)

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/edwinlov3tt/approval-dashboard.git
cd approval-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Login

Use any email and password to log in (simple authentication for development).

## Project Structure

```
/src
  /pages
    /login        - Login page
    /dashboard    - Dashboard with stats and activity
    /campaigns    - Campaigns management
    /calendar     - Calendar view
    /profile      - Profile settings
  /components
    /layout       - TopNav, Sidebar, Layout
    /ui           - Button, Badge, Card, Modal, ProgressBar
  /lib
    /mockData.js  - Mock data for testing
    /auth.jsx     - Authentication context
  /styles
    /index.css    - Tailwind config and custom styles
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Design System

The application uses a Meta-inspired design system with:

- **Colors**: Brand blue (#1877F2), status colors (green, yellow, red)
- **Typography**: System fonts, consistent sizing
- **Components**: Reusable UI components with Tailwind classes
- **Spacing**: Consistent spacing scale (sp-2 to sp-6)
- **Layout**: Full-width tables with controlled padding

## Next Steps (Phase 2+)

- Connect to real backend API
- Implement actual database integration
- Add real authentication (NextAuth.js)
- Build out approval workflow
- Add approver management
- Implement real-time features

## Documentation

See `CLAUDE.md` for detailed technical documentation and `context/Approval_Dashboard_Plan.md` for the full specification.

## Repository

https://github.com/edwinlov3tt/approval-dashboard
