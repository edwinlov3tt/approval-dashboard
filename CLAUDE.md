# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Client Approval Dashboard** - a standalone Next.js application designed to provide advertisers/clients with a dedicated portal for managing campaign approvals. This application is separate from but shares a database with the Creative Spec App (creative-spec.vercel.app).

**Key Purpose**: Allow clients to manage campaigns, set approvers, view ads, and approve/deny/revise ad content through a dedicated interface.

## Current Status

This repository is in the **planning phase**. The `context/` directory contains:
- `Approval_Dashboard_Plan.md` - Comprehensive technical specification (1,579 lines)
- `prototype.html` - Functional HTML/CSS/JS prototype demonstrating the UI/UX

**No implementation exists yet.** When beginning development, follow the 10-week implementation roadmap outlined in the specification.

## Architecture

### System Design
- **Frontend**: Next.js 14+ (App Router), React 18+, TailwindCSS
- **Backend**: Next.js API Routes or tRPC
- **Database**: Shared PostgreSQL database with Creative Spec App
- **Auth**: NextAuth.js (OAuth + Email magic links)
- **Deployment**: Vercel (domain: approve.your-domain.com)

### Database Integration
This app shares the PostgreSQL database with the Creative Spec App but adds new tables:
- `campaigns` - Campaign metadata and status tracking
- `campaign_ads` - Join table linking campaigns to ads
- `campaign_approvers` - Approver management per campaign
- `user_profiles` - Enhanced user profiles with vacation mode

**Important**: The `ads`, `advertisers`, and `approval_requests` tables are shared with the Creative Spec App. Do not modify their schemas without coordination.

### Key Architectural Principles
1. **Data flows one direction**: Creative Spec App creates ads → Approval Dashboard consumes/manages them
2. **Campaign status auto-updates**: Database triggers update campaign status based on ad approval states
3. **API integration**: Approval Dashboard calls Creative Spec API endpoints for approval actions
4. **Separation of concerns**: Two independent apps, single shared database

## Design System

The application uses a **Meta-inspired design system** matching the Creative Spec App:

### Design Tokens
```css
--brand: #1877F2           /* Meta Blue */
--bg-canvas: #F0F2F5       /* Background gray */
--bg-surface: #FFFFFF      /* Card background */
--text-primary: #1C1E21    /* Dark text */
--success: #4CAF50         /* Approval green */
--danger: #E41E3F          /* Denial red */
--warning: #FFC107         /* Pending yellow */
```

### Component Patterns
- Use existing Meta-style components from Creative Spec App when possible
- Status badges with icons: ✓ (approved), ✗ (denied), ⏳ (waiting), ◐ (in progress)
- Card-based layouts with consistent spacing (--sp-4: 16px, --sp-6: 24px)
- Modal overlays for creation/editing flows

**Reference**: See `context/prototype.html` for visual design implementation details.

## Database Schema

### New Tables to Implement

```sql
-- campaigns table
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER REFERENCES advertisers(id),
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'waiting',
  start_date DATE,
  end_date DATE,
  total_ads INTEGER DEFAULT 0,
  approved_ads INTEGER DEFAULT 0,
  denied_ads INTEGER DEFAULT 0,
  pending_ads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- campaign_ads join table
CREATE TABLE campaign_ads (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  ad_id INTEGER REFERENCES ads(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE(campaign_id, ad_id)
);

-- campaign_approvers
CREATE TABLE campaign_approvers (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  is_final_decision_maker BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'active',
  vacation_start_date DATE,
  vacation_end_date DATE,
  UNIQUE(campaign_id, email)
);

-- user_profiles (enhanced stakeholders)
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER REFERENCES advertisers(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  password_hash TEXT,
  is_on_vacation BOOLEAN DEFAULT FALSE,
  vacation_start_date DATE,
  vacation_end_date DATE
);
```

**Critical**: Implement the `update_campaign_status()` trigger function to automatically update campaign status when ad approvals change (see lines 266-329 in specification).

## API Endpoints

### New Endpoints to Create

**Campaign Management**:
- `GET /api/dashboard/campaigns?advertiserId={id}` - List campaigns
- `POST /api/dashboard/campaigns` - Create campaign
- `GET /api/dashboard/campaigns/[id]` - Get campaign details
- `PATCH /api/dashboard/campaigns/[id]` - Update campaign
- `DELETE /api/dashboard/campaigns/[id]` - Delete campaign

**Approver Management**:
- `GET /api/dashboard/campaigns/[id]/approvers` - List approvers
- `POST /api/dashboard/campaigns/[id]/approvers` - Add approver
- `PATCH /api/dashboard/approvers/[id]` - Update approver
- `POST /api/dashboard/approvers/[id]/vacation` - Set vacation mode

**Calendar & Analytics**:
- `GET /api/dashboard/calendar?start={date}&end={date}` - Calendar events
- `GET /api/dashboard/stats?advertiserId={id}` - Dashboard metrics

### Existing Endpoints to Integrate
Reuse these from Creative Spec App:
- `GET /api/approval/ad/[adId]` - Get ad approval details
- `POST /api/approval/submit` - Submit approval decision
- `POST /api/approval/revision` - Submit revision request

## Key Features to Implement

### 1. Campaign Management (Phase 2)
- Table view with filters (all, waiting, approved, denied, in_progress)
- Kanban board view with drag-and-drop (using @dnd-kit/core)
- Progress bars showing X/Y ads approved
- CRUD operations for campaigns

### 2. Approval Workflow (Phase 3)
- Reuse approval view layout from Creative Spec App
- Display ad creative with approve/deny/revise actions
- Activity timeline showing approval history
- Real-time presence indicators (who's viewing)

### 3. Approver Management (Phase 4)
- Add/edit/remove approvers per campaign
- "Final Decision Maker" designation
- Vacation mode with delegation
- Automatic routing to delegates when approver is on vacation

### 4. Calendar View (Phase 5)
- FullCalendar or React Big Calendar integration
- Display campaigns and ads on timeline
- Color-coded by status (green=approved, yellow=pending, red=denied)
- Click to view campaign/ad details

### 5. Profile Management (Phase 6)
- User profile settings (name, phone, photo)
- Vacation mode toggle with date range
- Password management
- Email verification

## Implementation Roadmap

Follow the 10-week phased approach in the specification:
1. **Phase 1 (Weeks 1-2)**: Foundation - Project setup, auth, database migrations
2. **Phase 2 (Weeks 3-4)**: Campaign Management - CRUD, table view, filters
3. **Phase 3 (Weeks 5-6)**: Approval Integration - Ad review, approve/deny actions
4. **Phase 4 (Week 7)**: Approver Management - Add approvers, vacation mode
5. **Phase 5 (Week 8)**: Kanban & Calendar - Alternative views
6. **Phase 6 (Week 9)**: Profile & Settings - User management
7. **Phase 7 (Week 10)**: Polish & Launch - Error handling, optimization, deployment

## Technology Stack

### Core Dependencies (to install)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "next-auth": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "@tanstack/react-table": "^8.0.0",
    "@dnd-kit/core": "^6.0.0",
    "zustand": "^4.0.0",
    "react-hot-toast": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tailwindcss": "^3.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### State Management
- **TanStack Query** for server state (campaigns, approvals, etc.)
- **Zustand** for client state (UI state, filters, etc.)
- Implement optimistic updates for approval actions

### Database Access
Choose **Drizzle ORM** or raw SQL with prepared statements. The specification does not prescribe a specific ORM, but Drizzle is recommended for type safety.

## Environment Variables

```bash
# Database (shared with Creative Spec)
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth
NEXTAUTH_URL=https://approve.your-domain.com
NEXTAUTH_SECRET=your-secret-key

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=approvals@your-domain.com

# Creative Spec API Integration
CREATIVE_SPEC_API_URL=https://creative-spec.vercel.app
CREATIVE_SPEC_API_KEY=optional-api-key-for-server-to-server

# Feature Flags
ENABLE_KANBAN_VIEW=true
ENABLE_CALENDAR_VIEW=true
ENABLE_VACATION_MODE=true
```

## Security Considerations

### Authentication & Authorization
- All dashboard routes require authentication (use NextAuth.js middleware)
- Verify advertiser ownership on all API endpoints
- Users can only access campaigns for their advertiser_id
- Validate all inputs with Zod schemas

### Input Validation Example
```typescript
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  advertiser_id: z.number().int().positive(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
})
```

## Performance Optimization

### Caching Strategy
- Use TanStack Query with 5-minute stale time for campaigns list
- Implement optimistic updates for approval actions
- Add database indexes on frequently queried columns:
  ```sql
  CREATE INDEX idx_campaigns_advertiser_status ON campaigns(advertiser_id, status);
  CREATE INDEX idx_campaign_ads_campaign ON campaign_ads(campaign_id);
  ```

### Database Optimization
- Campaign status auto-updates via triggers (not application code)
- Consider materialized views for dashboard stats if dataset grows large
- Use `SELECT` field limiting to reduce data transfer

## Testing

### Test Coverage Requirements
- Unit tests for API endpoints (campaign CRUD, approver management)
- Integration tests for approval workflow
- E2E tests with Playwright for critical paths:
  - Create campaign → Add ads → Approve/deny → Verify status update
  - Vacation mode delegation workflow

### Test Command Structure (to implement)
```bash
npm run test           # Run all tests
npm run test:unit      # Unit tests only
npm run test:e2e       # E2E tests with Playwright
npm run test:coverage  # Coverage report
```

## Integration with Creative Spec App

### API Communication Pattern
```typescript
// lib/creativeSpecApi.ts
const API_BASE = process.env.CREATIVE_SPEC_API_URL

export async function getApprovalDetails(adId: number, email: string) {
  const response = await fetch(
    `${API_BASE}/api/approval/ad/${adId}?email=${email}`
  )
  return response.json()
}

export async function submitApproval(data: ApprovalSubmission) {
  const response = await fetch(`${API_BASE}/api/approval/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
```

### Shared Data Contracts
- `ads` table columns: id, short_id, ad_copy (JSONB), approval_status
- `approval_requests` table columns: id, ad_id, status, created_at
- Status values: 'pending', 'approved', 'rejected', 'revision_requested'

**Do not modify shared table schemas without coordinating with Creative Spec App team.**

## Reference Documentation

- **Full Specification**: `context/Approval_Dashboard_Plan.md` (1,579 lines) - Comprehensive technical details, API contracts, database schema, UI mockups
- **UI Prototype**: `context/prototype.html` - Functional HTML prototype demonstrating design system and interactions
- **Database Schema**: Lines 122-262 in specification
- **API Endpoints**: Lines 332-533 in specification
- **Design Tokens**: Lines 810-856 in specification
- **Implementation Phases**: Lines 1157-1308 in specification
