# Client Approval Dashboard - Technical Specification

**Version:** 1.0
**Date:** 2025-10-20
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Database Schema](#database-schema)
4. [API Integration](#api-integration)
5. [Dashboard Features](#dashboard-features)
6. [Design System](#design-system)
7. [Authentication & Authorization](#authentication--authorization)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Executive Summary

### Purpose

The Client Approval Dashboard is a **separate standalone application** that provides advertisers/clients with a dedicated portal to:
- Manage campaigns and their associated ads
- Monitor approval workflows
- Set and manage approvers
- View start/end dates via calendar
- Approve, deny, or request revisions on ads

### Key Differentiators

| Feature | Creative Spec App (Current) | Approval Dashboard (New) |
|---------|----------------------------|--------------------------|
| **Primary Users** | Agency staff (AEs, DCMs, Buyers) | Clients/Advertisers |
| **Domain** | `creative-spec.vercel.app` | `approve.your-domain.com` |
| **Purpose** | Create & export ad specs | Review & approve campaigns |
| **Data Flow** | Creates ads → Initiates approval | Consumes approval data |
| **Database** | Shared PostgreSQL database | Shared PostgreSQL database |
| **Authentication** | Email-based (lightweight) | OAuth + Email (enhanced) |

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHARED DATABASE (PostgreSQL)                  │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────┐            │
│  │ advertisers│  │ campaigns   │  │ ads          │            │
│  │ campaigns  │◄─┤ campaign_ads│◄─┤ approval_*   │            │
│  │ stakeholders│ │ approvers   │  │              │            │
│  └────────────┘  └─────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────────────────────┘
           ▲                                       ▲
           │                                       │
           │         SHARED API LAYER              │
           │    (REST/GraphQL on Vercel)           │
           │                                       │
    ┌──────┴────────┐                   ┌─────────┴──────────┐
    │  CREATIVE     │                   │  APPROVAL          │
    │  SPEC APP     │                   │  DASHBOARD         │
    │               │                   │                    │
    │ - Create ads  │                   │ - View campaigns   │
    │ - Export      │                   │ - Approve/Deny     │
    │ - Initiate    │                   │ - Manage approvers │
    │   approval    │                   │ - Calendar view    │
    └───────────────┘                   └────────────────────┘
  creative-spec.app                   approve.your-domain.com
```

### Technology Stack

#### Approval Dashboard (New App)
```yaml
Frontend:
  - Framework: Next.js 14+ (App Router)
  - UI Library: React 18+
  - Styling: TailwindCSS (matching design tokens)
  - State: Zustand / TanStack Query
  - Tables: TanStack Table
  - Drag & Drop: @dnd-kit/core
  - Calendar: FullCalendar or React Big Calendar
  - Notifications: React Hot Toast

Backend:
  - API: Next.js API Routes / tRPC
  - Database: Shared PostgreSQL (via Vercel Postgres)
  - ORM: Drizzle ORM or Raw SQL
  - Auth: NextAuth.js (OAuth + Email magic links)
  - Email: Resend (existing)

Deployment:
  - Platform: Vercel
  - Domain: approve.your-domain.com
  - Environment: Production, Staging, Development
```

### Integration Strategy

#### Database Sharing
Both applications connect to the **same PostgreSQL database**:
- Creative Spec App creates `ads`, `advertisers`, `approval_requests`
- Approval Dashboard reads these + creates `campaigns`, `campaign_ads`
- Shared tables: `advertisers`, `ads`, `approval_*` tables

#### API Communication
```typescript
// Approval Dashboard calls Creative Spec API endpoints
const API_BASE = process.env.CREATIVE_SPEC_API_URL || 'https://creative-spec.vercel.app'

// Example: Get approval details
fetch(`${API_BASE}/api/approval/ad/${adId}?email=${userEmail}`)
```

---

## Database Schema

### New Tables for Campaign Management

#### `campaigns` Table
```sql
CREATE TABLE campaigns (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,

  -- Campaign details
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'waiting',
    -- 'waiting' = pending approvals
    -- 'approved' = all ads approved
    -- 'denied' = any ad denied
    -- 'in_progress' = partially approved

  -- Date tracking
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Computed fields (updated via triggers)
  total_ads INTEGER DEFAULT 0,
  approved_ads INTEGER DEFAULT 0,
  denied_ads INTEGER DEFAULT 0,
  pending_ads INTEGER DEFAULT 0,

  CONSTRAINT valid_status CHECK (status IN ('waiting', 'approved', 'denied', 'in_progress'))
);

CREATE INDEX idx_campaigns_advertiser ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);
```

#### `campaign_ads` Table (Join Table)
```sql
CREATE TABLE campaign_ads (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  ad_id INTEGER NOT NULL REFERENCES ads(id) ON DELETE CASCADE,

  -- Order within campaign
  display_order INTEGER DEFAULT 0,

  -- Ad-level metadata
  notes TEXT,
  added_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(campaign_id, ad_id)
);

CREATE INDEX idx_campaign_ads_campaign ON campaign_ads(campaign_id);
CREATE INDEX idx_campaign_ads_ad ON campaign_ads(ad_id);
```

#### `campaign_approvers` Table
```sql
CREATE TABLE campaign_approvers (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

  -- Approver details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),

  -- Final decision maker flag
  is_final_decision_maker BOOLEAN DEFAULT FALSE,

  -- Status
  status VARCHAR(50) DEFAULT 'active',
    -- 'active', 'on_vacation', 'inactive'

  -- Vacation delegation
  vacation_delegate_id INTEGER REFERENCES campaign_approvers(id),
  vacation_start_date DATE,
  vacation_end_date DATE,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(campaign_id, email)
);

CREATE INDEX idx_campaign_approvers_campaign ON campaign_approvers(campaign_id);
CREATE INDEX idx_campaign_approvers_email ON campaign_approvers(email);
CREATE INDEX idx_campaign_approvers_status ON campaign_approvers(status);
```

#### `user_profiles` Table (Enhanced Stakeholder)
```sql
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  advertiser_id INTEGER NOT NULL REFERENCES advertisers(id) ON DELETE CASCADE,

  -- Profile details
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),

  -- Profile photo
  profile_photo_url TEXT,

  -- Auth
  password_hash TEXT, -- bcrypt hash
  email_verified BOOLEAN DEFAULT FALSE,

  -- Vacation mode
  is_on_vacation BOOLEAN DEFAULT FALSE,
  vacation_delegate_id INTEGER REFERENCES user_profiles(id),
  vacation_start_date DATE,
  vacation_end_date DATE,
  vacation_auto_reply TEXT,

  -- Metadata
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_vacation_dates CHECK (
    (is_on_vacation = FALSE) OR
    (vacation_start_date IS NOT NULL AND vacation_end_date IS NOT NULL)
  )
);

CREATE INDEX idx_user_profiles_advertiser ON user_profiles(advertiser_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
```

### Database Triggers for Auto-Updates

#### Auto-Update Campaign Status
```sql
-- Function to update campaign stats and status
CREATE OR REPLACE FUNCTION update_campaign_status()
RETURNS TRIGGER AS $$
DECLARE
  v_campaign_id INTEGER;
  v_total INTEGER;
  v_approved INTEGER;
  v_denied INTEGER;
  v_pending INTEGER;
  v_new_status VARCHAR(50);
BEGIN
  -- Get campaign_id from the affected ad
  SELECT campaign_id INTO v_campaign_id
  FROM campaign_ads
  WHERE ad_id = NEW.ad_id OR ad_id = OLD.ad_id
  LIMIT 1;

  IF v_campaign_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count ads in campaign by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE ar.status = 'approved'),
    COUNT(*) FILTER (WHERE ar.status = 'rejected'),
    COUNT(*) FILTER (WHERE ar.status IN ('pending', 'in_review'))
  INTO v_total, v_approved, v_denied, v_pending
  FROM campaign_ads ca
  LEFT JOIN approval_requests ar ON ar.ad_id = ca.ad_id
  WHERE ca.campaign_id = v_campaign_id;

  -- Determine campaign status
  IF v_denied > 0 THEN
    v_new_status := 'denied';
  ELSIF v_approved = v_total AND v_total > 0 THEN
    v_new_status := 'approved';
  ELSIF v_approved > 0 THEN
    v_new_status := 'in_progress';
  ELSE
    v_new_status := 'waiting';
  END IF;

  -- Update campaign
  UPDATE campaigns
  SET
    total_ads = v_total,
    approved_ads = v_approved,
    denied_ads = v_denied,
    pending_ads = v_pending,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = v_campaign_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on approval_requests status changes
CREATE TRIGGER trigger_update_campaign_status
AFTER INSERT OR UPDATE OF status ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION update_campaign_status();
```

---

## API Integration

### Shared API Endpoints

The Approval Dashboard will use **existing Creative Spec API endpoints** plus new ones:

#### Existing Endpoints (Reused)
```typescript
// Get approval details for an ad
GET /api/approval/ad/[adId]?email={userEmail}

// Get approval by ID
GET /api/approval/[approvalId]?email={userEmail}

// Submit approval decision
POST /api/approval/submit
{
  approval_request_id: number
  participant_id: number
  status: 'approved' | 'rejected' | 'revision_requested'
  comments?: string
}

// Submit revision
POST /api/approval/revision
{
  approval_request_id: number
  participant_id: number
  element_path: string
  revised_value: string
  comment?: string
}

// Get activity timeline
Embedded in approval details response
```

#### New Endpoints (To Be Added)

##### Campaign Management
```typescript
// List campaigns for advertiser
GET /api/dashboard/campaigns?advertiserId={id}
Response: {
  campaigns: Array<{
    id: number
    name: string
    status: 'waiting' | 'approved' | 'denied' | 'in_progress'
    start_date: string
    end_date: string
    total_ads: number
    approved_ads: number
    denied_ads: number
    pending_ads: number
    ads: Array<Ad>
  }>
}

// Get single campaign
GET /api/dashboard/campaigns/[campaignId]

// Create campaign
POST /api/dashboard/campaigns
{
  advertiser_id: number
  name: string
  description?: string
  start_date?: string
  end_date?: string
}

// Update campaign
PATCH /api/dashboard/campaigns/[campaignId]
{
  name?: string
  description?: string
  start_date?: string
  end_date?: string
}

// Delete campaign
DELETE /api/dashboard/campaigns/[campaignId]

// Add ad to campaign
POST /api/dashboard/campaigns/[campaignId]/ads
{
  ad_id: number
  display_order?: number
}

// Remove ad from campaign
DELETE /api/dashboard/campaigns/[campaignId]/ads/[adId]
```

##### Approver Management
```typescript
// List approvers for campaign
GET /api/dashboard/campaigns/[campaignId]/approvers

// Add approver
POST /api/dashboard/campaigns/[campaignId]/approvers
{
  first_name: string
  last_name: string
  email: string
  phone?: string
  is_final_decision_maker?: boolean
}

// Update approver
PATCH /api/dashboard/approvers/[approverId]
{
  first_name?: string
  last_name?: string
  phone?: string
  is_final_decision_maker?: boolean
  status?: 'active' | 'on_vacation' | 'inactive'
}

// Set vacation mode
POST /api/dashboard/approvers/[approverId]/vacation
{
  vacation_start_date: string
  vacation_end_date: string
  vacation_delegate_id?: number
}

// Delete approver
DELETE /api/dashboard/approvers/[approverId]
```

##### Profile Management
```typescript
// Get current user profile
GET /api/dashboard/profile

// Update profile
PATCH /api/dashboard/profile
{
  first_name?: string
  last_name?: string
  phone?: string
  profile_photo_url?: string
}

// Set vacation mode
POST /api/dashboard/profile/vacation
{
  is_on_vacation: boolean
  vacation_start_date?: string
  vacation_end_date?: string
  vacation_delegate_id?: number
  vacation_auto_reply?: string
}

// Change password
POST /api/dashboard/profile/password
{
  current_password: string
  new_password: string
}
```

##### Calendar View
```typescript
// Get calendar events (ads + campaigns)
GET /api/dashboard/calendar?start={date}&end={date}&advertiserId={id}
Response: {
  events: Array<{
    id: string
    type: 'ad' | 'campaign'
    title: string
    start: string
    end: string
    status: string
    campaign_id?: number
    ad_id?: number
  }>
}
```

##### Dashboard Analytics
```typescript
// Get dashboard overview stats
GET /api/dashboard/stats?advertiserId={id}
Response: {
  total_campaigns: number
  active_campaigns: number
  pending_approvals: number
  approved_this_month: number
  denied_this_month: number
  upcoming_end_dates: Array<{
    campaign_id: number
    campaign_name: string
    end_date: string
    days_remaining: number
  }>
}
```

---

## Dashboard Features

### 1. Campaigns List View

#### Table View
```typescript
// Columns
interface CampaignTableColumns {
  name: string          // Campaign name
  status: CampaignStatus // Badge with color
  total_ads: number     // Total ads count
  approved: number      // Green badge
  pending: number       // Yellow badge
  denied: number        // Red badge
  start_date: Date      // Formatted date
  end_date: Date        // Formatted date + days remaining
  actions: JSX.Element  // View, Edit, Delete buttons
}

// Filters
type StatusFilter = 'all' | 'waiting' | 'approved' | 'denied' | 'in_progress'

// Sorting
type SortOptions = 'name' | 'status' | 'start_date' | 'end_date' | 'created_at'
```

#### Kanban View
```typescript
// Columns (drag & drop)
interface KanbanColumn {
  id: 'waiting' | 'in_progress' | 'approved' | 'denied'
  title: string
  campaigns: Campaign[]
  color: string
}

// Card Component
interface CampaignCard {
  id: number
  name: string
  ads_summary: {
    total: number
    approved: number
    pending: number
  }
  start_date: Date
  end_date: Date
  thumbnail?: string // First ad creative
}
```

### 2. Campaign Detail View

Layout:
```
┌─────────────────────────────────────────────────────────┐
│ Campaign Header                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ Name: Summer Sale 2025                            │   │
│ │ Status: [In Progress] badge                       │   │
│ │ Dates: Jun 1 - Aug 31, 2025 (91 days remaining)  │   │
│ │ Progress: [=========>---] 6/10 ads approved       │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ Tabs: [Ads] [Approvers] [Activity] [Settings]          │
│                                                          │
│ ┌─────────────────────────────────────────────────┐    │
│ │ Ads Table                                        │    │
│ │ ┌────────────────────────────────────────────┐  │    │
│ │ │ Ad Name │ Status │ Created │ Due │ Actions │  │    │
│ │ ├────────────────────────────────────────────┤  │    │
│ │ │ Ad 1    │ ✓ Approved │ Jun 1 │ - │ [View] │  │    │
│ │ │ Ad 2    │ ⏳ Waiting │ Jun 2 │ Jun 15│[Approve]│  │
│ │ │ Ad 3    │ ✗ Denied  │ Jun 3 │ - │ [Revise]│  │    │
│ │ └────────────────────────────────────────────┘  │    │
│ └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3. Ad Approval View

Reuses existing ApprovalViewPage layout with enhancements:

```
┌────────────────────────────────────────────────────────────────┐
│ Header: [← Back to Campaign]  Ad Name  [Status Badge]          │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────┐  ┌────────────────────┐  ┌──────────────┐ │
│ │ Approval Flow  │  │   Ad Creative      │  │ Action Menu  │ │
│ │                │  │                    │  │              │ │
│ │ Timeline:      │  │  ┌──────────────┐ │  │ [✓ Approve]  │ │
│ │ • Sent         │  │  │              │ │  │ [✗ Deny]     │ │
│ │ • Opened       │  │  │   Preview    │ │  │ [✎ Revise]   │ │
│ │ • Viewing now  │  │  │              │ │  │              │ │
│ │                │  │  └──────────────┘ │  │ Comments:    │ │
│ │ Approvers:     │  │                    │  │ ┌──────────┐ │ │
│ │ ☐ John (you)   │  │  Ad Copy:          │  │ │          │ │ │
│ │ ☐ Sarah        │  │  • Primary Text    │  │ │          │ │ │
│ │ ☐ Mike         │  │  • Headline        │  │ │          │ │ │
│ │                │  │  • Description     │  │ └──────────┘ │ │
│ └────────────────┘  └────────────────────┘  └──────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 4. Table View with Filters

```typescript
// Table implementation using TanStack Table
import { createColumnHelper, useReactTable } from '@tanstack/react-table'

const columnHelper = createColumnHelper<ApprovalItem>()

const columns = [
  columnHelper.accessor('ad_name', {
    header: 'Ad Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('campaign_name', {
    header: 'Campaign Name',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: info => <StatusBadge status={info.getValue()} />,
    filterFn: 'equals',
  }),
  columnHelper.accessor('created_at', {
    header: 'Created',
    cell: info => formatDate(info.getValue()),
  }),
  columnHelper.accessor('due_date', {
    header: 'Due Date',
    cell: info => info.getValue() ? formatDateWithDaysLeft(info.getValue()) : '—',
  }),
  columnHelper.display({
    id: 'actions',
    header: 'Actions',
    cell: props => <ActionButtons row={props.row.original} />,
  }),
]

// Filter tabs
const filterTabs = [
  { id: 'all', label: 'All Approvals', count: totalCount },
  { id: 'pending', label: 'Pending', count: pendingCount },
  { id: 'approved', label: 'Approved', count: approvedCount },
  { id: 'denied', label: 'Denied', count: deniedCount },
]
```

### 5. Approver Management

```
┌─────────────────────────────────────────────────────────┐
│ Approvers for "Summer Sale 2025"                        │
│ [+ Add Approver]                                         │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ✓ John Smith • john@company.com • (555) 123-4567   │ │
│ │   Final Decision Maker                              │ │
│ │   [Edit] [Remove]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Sarah Johnson • sarah@company.com                   │ │
│ │   [Edit] [Remove]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Mike Davis • mike@company.com • 🏖️ On Vacation     │ │
│ │   Delegate: Sarah Johnson                           │ │
│ │   Returns: Aug 15, 2025                             │ │
│ │   [Edit] [Remove]                                   │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 6. Profile Management

```
┌─────────────────────────────────────────────────────────┐
│ Profile Settings                                         │
│                                                          │
│ ┌────────┐                                              │
│ │ Photo  │ [Upload Photo]                               │
│ └────────┘                                              │
│                                                          │
│ First Name:  [John                    ]                 │
│ Last Name:   [Smith                   ]                 │
│ Email:       john@company.com (verified)                │
│ Phone:       [(555) 123-4567          ]                 │
│                                                          │
│ ─────────────────────────────────────────────────       │
│                                                          │
│ 🏖️ Vacation Mode                                        │
│ ┌─────────────────────────────────────────────────┐    │
│ │ ☐ I'm going on vacation                         │    │
│ │                                                  │    │
│ │ Start Date: [Select date]                       │    │
│ │ End Date:   [Select date]                       │    │
│ │                                                  │    │
│ │ Delegate approvals to:                          │    │
│ │ [Select approver ▾]                             │    │
│ │                                                  │    │
│ │ Auto-reply message:                             │    │
│ │ ┌──────────────────────────────────────────┐   │    │
│ │ │ I'm out of office until Aug 15...        │   │    │
│ │ └──────────────────────────────────────────┘   │    │
│ └─────────────────────────────────────────────────┘    │
│                                                          │
│ ─────────────────────────────────────────────────       │
│                                                          │
│ 🔐 Change Password                                      │
│ Current Password: [••••••••]                            │
│ New Password:     [••••••••]                            │
│ Confirm Password: [••••••••]                            │
│                                                          │
│ [Save Changes]                                           │
└─────────────────────────────────────────────────────────┘
```

### 7. Calendar View

```typescript
// Using FullCalendar or React Big Calendar
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'campaign' | 'ad'
  status: 'waiting' | 'approved' | 'denied' | 'in_progress'
  backgroundColor: string
  borderColor: string
  extendedProps: {
    campaign_id?: number
    ad_id?: number
    days_remaining?: number
  }
}

// Color scheme
const EVENT_COLORS = {
  campaign: {
    waiting: '#FFC107',      // Yellow
    in_progress: '#2196F3',  // Blue
    approved: '#4CAF50',     // Green
    denied: '#F44336',       // Red
  },
  ad: {
    waiting: '#FFE082',      // Light yellow
    approved: '#81C784',     // Light green
    denied: '#E57373',       // Light red
  }
}
```

Calendar Features:
- **Month View** - Shows all campaigns and ads
- **Week View** - Detailed daily breakdown
- **List View** - Sortable list of upcoming events
- **Filters** - Toggle campaigns/ads visibility
- **Color Coding** - Status-based colors
- **Click Event** - Opens campaign or ad detail
- **Due Date Warnings** - Highlight items due soon (< 7 days)

---

## Design System

### Design Tokens (Match Creative Spec App)

```css
/* Colors */
--brand: #1877F2;           /* Meta Blue */
--brand-hover: #166FE5;     /* Darker blue */
--bg-canvas: #F0F2F5;       /* Background gray */
--bg-surface: #FFFFFF;      /* Card background */
--border: #DADDE1;          /* Border gray */
--divider: #E4E6EB;         /* Divider gray */

/* Text Colors */
--text-primary: #1C1E21;    /* Dark text */
--text-secondary: #65676B;  /* Medium text */
--text-muted: #8A8D91;      /* Light text */

/* Status Colors */
--success: #4CAF50;         /* Green */
--warning: #FFC107;         /* Yellow */
--danger: #E41E3F;          /* Red */
--info: #2196F3;            /* Blue */

/* Spacing */
--sp-2: 8px;
--sp-3: 12px;
--sp-4: 16px;
--sp-5: 20px;
--sp-6: 24px;

/* Border Radius */
--r-card: 12px;
--r-md: 8px;
--r-pill: 9999px;

/* Shadows */
--sh-1: 0 2px 4px rgba(0,0,0,0.1);
--sh-2: 0 4px 12px rgba(0,0,0,0.12);

/* Typography */
--fs-11: 11px; --lh-14: 14px;
--fs-12: 12px; --lh-18: 18px;
--fs-14: 14px; --lh-20: 20px;
--fs-16: 16px; --lh-22: 22px;
--fs-20: 20px; --lh-28: 28px;
```

### Component Library

Reuse existing Meta-style components:

```typescript
// Button variants
<button className="meta-button">
  Primary Action
</button>

<button className="meta-button-secondary">
  Secondary Action
</button>

// Input fields
<input className="meta-input" placeholder="Enter text..." />

// Text areas
<textarea className="meta-textarea" rows={4} />

// Cards
<div className="meta-card p-sp-4">
  <h2 className="meta-section-title">Section Title</h2>
  <p className="meta-body">Body text content</p>
</div>

// Status badges
<span className="meta-chip meta-chip-selected">
  Approved
</span>

// Table styling
<table className="w-full">
  <thead className="border-b border-divider">
    <tr>
      <th className="text-left meta-label p-sp-3">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-divider hover:bg-canvas">
      <td className="p-sp-3 meta-body">Cell content</td>
    </tr>
  </tbody>
</table>
```

### Layout Patterns

#### Dashboard Shell
```tsx
<div className="min-h-screen bg-canvas">
  {/* Top Navigation */}
  <nav className="bg-surface border-b border-divider h-14 px-sp-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <Logo />
      <UserMenu />
    </div>
  </nav>

  {/* Sidebar + Content */}
  <div className="flex">
    <aside className="w-64 bg-surface border-r border-divider min-h-[calc(100vh-56px)]">
      <SidebarNav />
    </aside>

    <main className="flex-1 p-sp-6">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </main>
  </div>
</div>
```

#### Card Grid
```tsx
<div className="meta-card-grid">
  <div className="meta-card meta-card-padding">
    <h2 className="meta-section-title mb-sp-4">Section 1</h2>
    <div className="meta-row-rhythm">
      {items.map(item => <Item key={item.id} />)}
    </div>
  </div>

  <div className="meta-card meta-card-padding">
    <h2 className="meta-section-title mb-sp-4">Section 2</h2>
    {/* Content */}
  </div>
</div>
```

### Status Badge System

```tsx
interface StatusBadgeProps {
  status: 'waiting' | 'approved' | 'denied' | 'in_progress' | 'revision'
}

const STATUS_CONFIG = {
  waiting: {
    label: 'Waiting',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: '⏳',
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: '✓',
  },
  denied: {
    label: 'Denied',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: '✗',
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: '◐',
  },
  revision: {
    label: 'Revision',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    icon: '✎',
  },
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`meta-chip border ${config.color}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}
```

---

## Authentication & Authorization

### Authentication Strategy

#### NextAuth.js Configuration
```typescript
// pages/api/auth/[...nextauth].ts
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import EmailProvider from 'next-auth/providers/email'
import { compare } from 'bcryptjs'

export default NextAuth({
  providers: [
    // Email magic link (passwordless)
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),

    // Email + Password
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Query user_profiles table
        const user = await getUserByEmail(credentials.email)

        if (!user || !user.password_hash) {
          return null
        }

        // Verify password
        const isValid = await compare(credentials.password, user.password_hash)

        if (!isValid) {
          return null
        }

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          advertiser_id: user.advertiser_id,
        }
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.advertiser_id = user.advertiser_id
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.advertiser_id = token.advertiser_id
      }
      return session
    }
  },

  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/error',
  },
})
```

### Authorization Middleware

```typescript
// middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      // Check if user is authenticated
      if (!token) return false

      // Check if accessing admin routes (future)
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token.role === 'admin'
      }

      return true
    },
  },
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/campaigns/:path*',
    '/profile/:path*',
  ]
}
```

### Role-Based Access Control (RBAC)

```typescript
// lib/permissions.ts
export enum Role {
  OWNER = 'owner',           // Full access
  ADMIN = 'admin',           // Manage approvers
  APPROVER = 'approver',     // View & approve
  VIEWER = 'viewer',         // Read-only
}

export enum Permission {
  VIEW_CAMPAIGNS = 'view_campaigns',
  CREATE_CAMPAIGN = 'create_campaign',
  EDIT_CAMPAIGN = 'edit_campaign',
  DELETE_CAMPAIGN = 'delete_campaign',
  APPROVE_AD = 'approve_ad',
  MANAGE_APPROVERS = 'manage_approvers',
  VIEW_ANALYTICS = 'view_analytics',
}

const ROLE_PERMISSIONS = {
  [Role.OWNER]: Object.values(Permission),
  [Role.ADMIN]: [
    Permission.VIEW_CAMPAIGNS,
    Permission.CREATE_CAMPAIGN,
    Permission.EDIT_CAMPAIGN,
    Permission.APPROVE_AD,
    Permission.MANAGE_APPROVERS,
    Permission.VIEW_ANALYTICS,
  ],
  [Role.APPROVER]: [
    Permission.VIEW_CAMPAIGNS,
    Permission.APPROVE_AD,
  ],
  [Role.VIEWER]: [
    Permission.VIEW_CAMPAIGNS,
  ],
}

export const hasPermission = (
  role: Role,
  permission: Permission
): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}
```

---

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goals:**
- Set up new Next.js project
- Configure database connection
- Implement authentication
- Create base layout & navigation

**Tasks:**
```
✓ Initialize Next.js 14 project with TypeScript
✓ Set up TailwindCSS with design tokens
✓ Connect to shared PostgreSQL database
✓ Implement NextAuth.js with email + password
✓ Create database migrations for new tables:
  - campaigns
  - campaign_ads
  - campaign_approvers
  - user_profiles
✓ Build dashboard shell (nav, sidebar, layout)
✓ Create login/signup pages
✓ Implement protected routes middleware
```

### Phase 2: Campaign Management (Weeks 3-4)

**Goals:**
- CRUD operations for campaigns
- Campaign-ad associations
- Table view with filters

**Tasks:**
```
✓ Create API endpoints:
  - GET/POST /api/dashboard/campaigns
  - GET/PATCH/DELETE /api/dashboard/campaigns/[id]
  - POST/DELETE /api/dashboard/campaigns/[id]/ads
✓ Build Campaigns list page (table view)
✓ Implement filters (all, waiting, approved, denied)
✓ Create Campaign detail page
✓ Build "Add Campaign" modal
✓ Implement "Add Ad to Campaign" flow
✓ Create StatusBadge component
✓ Add progress indicators
```

### Phase 3: Approval Integration (Weeks 5-6)

**Goals:**
- Integrate with existing approval system
- Display ads for approval
- Implement approve/deny/revise actions

**Tasks:**
```
✓ Create API integration layer for Creative Spec API
✓ Build Ad Approval view (reuse layout from Creative Spec)
✓ Implement approval action handlers:
  - Approve ad
  - Deny ad
  - Request revision
✓ Add comment system
✓ Display approval activity timeline
✓ Show real-time presence (who's viewing)
✓ Handle vacation delegation logic
✓ Update campaign status based on ad approvals
```

### Phase 4: Approver Management (Week 7)

**Goals:**
- Manage approvers for campaigns
- Vacation mode & delegation

**Tasks:**
```
✓ Create API endpoints:
  - GET/POST /api/dashboard/campaigns/[id]/approvers
  - PATCH/DELETE /api/dashboard/approvers/[id]
  - POST /api/dashboard/approvers/[id]/vacation
✓ Build Approvers tab in Campaign detail
✓ Create "Add Approver" modal
✓ Implement "Final Decision Maker" flag
✓ Build vacation mode UI
✓ Add delegation selector
✓ Display approver status badges
```

### Phase 5: Kanban & Calendar Views (Week 8)

**Goals:**
- Alternative visualizations
- Calendar view for dates

**Tasks:**
```
✓ Install & configure @dnd-kit/core for drag-drop
✓ Create Kanban board view
✓ Implement drag-drop between columns
✓ Update campaign status on drag
✓ Install & configure FullCalendar
✓ Create Calendar page
✓ Implement calendar API endpoint
✓ Color-code events by status
✓ Add filters (campaigns, ads)
✓ Implement click-to-view event
```

### Phase 6: Profile & Settings (Week 9)

**Goals:**
- User profile management
- Vacation mode for users
- Password management

**Tasks:**
```
✓ Create API endpoints:
  - GET/PATCH /api/dashboard/profile
  - POST /api/dashboard/profile/vacation
  - POST /api/dashboard/profile/password
✓ Build Profile settings page
✓ Implement photo upload
✓ Add vacation mode toggle
✓ Create password change form
✓ Add email verification flow
✓ Display last login timestamp
```

### Phase 7: Polish & Launch (Week 10)

**Goals:**
- Performance optimization
- Error handling
- Deployment

**Tasks:**
```
✓ Add loading states & skeletons
✓ Implement error boundaries
✓ Add toast notifications
✓ Optimize database queries (indexes)
✓ Add request caching (React Query)
✓ Write E2E tests (Playwright)
✓ Security audit
✓ Deploy to Vercel (production)
✓ Set up custom domain (approve.your-domain.com)
✓ Configure environment variables
✓ Set up monitoring (Sentry, Vercel Analytics)
```

---

## Technical Considerations

### Performance Optimization

```typescript
// Use React Query for caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// Example: Fetch campaigns with caching
export const useCampaigns = (advertiserId: number) => {
  return useQuery({
    queryKey: ['campaigns', advertiserId],
    queryFn: () => fetchCampaigns(advertiserId),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 30, // 30 minutes
  })
}

// Optimistic updates for approvals
export const useApproveAd = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveAdRequest,
    onMutate: async (adId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['campaigns'])

      // Snapshot previous value
      const previousCampaigns = queryClient.getQueryData(['campaigns'])

      // Optimistically update
      queryClient.setQueryData(['campaigns'], (old: any) => {
        // Update ad status immediately
        return updateAdStatus(old, adId, 'approved')
      })

      return { previousCampaigns }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['campaigns'], context?.previousCampaigns)
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries(['campaigns'])
    },
  })
}
```

### Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_campaigns_advertiser_status ON campaigns(advertiser_id, status);
CREATE INDEX idx_campaign_ads_campaign_order ON campaign_ads(campaign_id, display_order);
CREATE INDEX idx_approvers_campaign_status ON campaign_approvers(campaign_id, status);

-- Materialized view for dashboard stats (optional, for large datasets)
CREATE MATERIALIZED VIEW dashboard_stats AS
SELECT
  c.advertiser_id,
  COUNT(DISTINCT c.id) AS total_campaigns,
  COUNT(DISTINCT c.id) FILTER (WHERE c.status IN ('waiting', 'in_progress')) AS active_campaigns,
  SUM(c.pending_ads) AS pending_approvals,
  COUNT(DISTINCT ca.ad_id) FILTER (
    WHERE ar.status = 'approved'
    AND ar.completed_at >= NOW() - INTERVAL '30 days'
  ) AS approved_this_month,
  COUNT(DISTINCT ca.ad_id) FILTER (
    WHERE ar.status = 'rejected'
    AND ar.completed_at >= NOW() - INTERVAL '30 days'
  ) AS denied_this_month
FROM campaigns c
LEFT JOIN campaign_ads ca ON ca.campaign_id = c.id
LEFT JOIN approval_requests ar ON ar.ad_id = ca.ad_id
GROUP BY c.advertiser_id;

-- Refresh materialized view daily
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (via pg_cron extension or external cron job)
```

### Security Best Practices

```typescript
// API Route Protection
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'

export default async function handler(req, res) {
  // Verify authentication
  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Verify advertiser ownership
  const { advertiserId } = req.query

  if (session.user.advertiser_id !== parseInt(advertiserId)) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  // Process request...
}

// Input validation with Zod
import { z } from 'zod'

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  advertiser_id: z.number().int().positive(),
})

// Validate input
try {
  const validated = createCampaignSchema.parse(req.body)
  // Use validated data
} catch (error) {
  return res.status(400).json({ error: error.errors })
}
```

---

## Appendix

### Sample API Responses

#### Campaign List Response
```json
{
  "campaigns": [
    {
      "id": 1,
      "advertiser_id": 5,
      "name": "Summer Sale 2025",
      "description": "Q3 promotional campaign",
      "status": "in_progress",
      "start_date": "2025-06-01",
      "end_date": "2025-08-31",
      "total_ads": 10,
      "approved_ads": 6,
      "denied_ads": 1,
      "pending_ads": 3,
      "created_at": "2025-05-15T10:00:00Z",
      "updated_at": "2025-06-10T14:30:00Z",
      "ads": [
        {
          "id": 42,
          "short_id": "abc123",
          "ad_copy": {
            "adName": "Summer Sale - Product A",
            "primaryText": "Save 30% on all products!",
            "headline": "Limited Time Offer"
          },
          "approval_status": "approved",
          "created_at": "2025-05-20T09:00:00Z"
        }
      ]
    }
  ],
  "total": 5,
  "page": 1,
  "per_page": 20
}
```

#### Calendar Events Response
```json
{
  "events": [
    {
      "id": "campaign-1",
      "type": "campaign",
      "title": "Summer Sale 2025",
      "start": "2025-06-01",
      "end": "2025-08-31",
      "status": "in_progress",
      "backgroundColor": "#2196F3",
      "borderColor": "#1976D2",
      "extendedProps": {
        "campaign_id": 1,
        "days_remaining": 45
      }
    },
    {
      "id": "ad-42",
      "type": "ad",
      "title": "Summer Sale - Product A",
      "start": "2025-06-01",
      "end": "2025-06-30",
      "status": "approved",
      "backgroundColor": "#81C784",
      "borderColor": "#66BB6A",
      "extendedProps": {
        "ad_id": 42,
        "campaign_id": 1
      }
    }
  ]
}
```

### Environment Variables

```bash
# .env.local for Approval Dashboard

# Database (shared with Creative Spec)
DATABASE_URL=postgresql://user:password@host:5432/database

# NextAuth
NEXTAUTH_URL=https://approve.your-domain.com
NEXTAUTH_SECRET=your-secret-key-here

# Email (Resend)
EMAIL_SERVER=smtp://resend.com
EMAIL_FROM=approvals@your-domain.com
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Creative Spec API Integration
CREATIVE_SPEC_API_URL=https://creative-spec.vercel.app
CREATIVE_SPEC_API_KEY=optional-api-key-for-server-to-server

# Feature Flags
ENABLE_KANBAN_VIEW=true
ENABLE_CALENDAR_VIEW=true
ENABLE_VACATION_MODE=true
```

---

## Summary

This approval dashboard provides a **complete client-facing solution** for campaign and ad approval management. By building it as a **separate application** that shares the database with the Creative Spec app, we achieve:

✅ **Clear separation of concerns** - Agency tool vs. client portal
✅ **Independent deployment** - Can iterate on each without affecting the other
✅ **Shared data** - No sync issues, single source of truth
✅ **Consistent design** - Reuses Meta design system
✅ **Scalability** - Can add features independently

The implementation follows a **10-week phased approach**, ensuring each component is built, tested, and integrated incrementally.

**Next Steps:**
1. Review and approve this specification
2. Set up new Next.js project repository
3. Configure shared database access
4. Begin Phase 1 implementation

---

*Document prepared by: Claude Code Assistant*
*For: Creative Spec & Approval Dashboard Project*
