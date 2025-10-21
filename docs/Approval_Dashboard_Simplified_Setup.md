# Simplified Approval Dashboard - View-Only Setup

## 🎯 Goal

Create a **view-only approval dashboard** where clients can:
- ✅ Login and see their ads
- ✅ View approval status and activity
- ✅ See company/advertiser information
- ✅ Click links to review ads (uses existing email approval flow)
- ❌ **NOT approve/deny directly in dashboard** (uses email links instead)

## 📊 Using Existing Database Tables

Your Creative Spec database already has everything needed:

### Existing Tables We'll Use
- `advertisers` - Company information
- `ads` - Ad details and content
- `approval_requests` - Links ads to advertisers with approval status
- `approval_participants` - Approvers (use for login)
- `approval_activity` - Tracking opens, clicks, approvals
- `email_tracking` - Email delivery status

### Tables We DON'T Need Yet
- ❌ `user_profiles` (use `approval_participants` instead)
- ❌ `campaigns` (optional, can add later)
- ❌ `campaign_ads` (optional, can add later)

## 🔧 Step-by-Step Setup

### Step 1: Update Approval Dashboard API to Use Existing Tables

In your approval dashboard, update the API routes to query existing tables instead of the new ones.

**File: `approval-dashboard/api/routes/auth.ts`**

Replace login logic to use `approval_participants`:

```typescript
import { Router } from 'express'
import { query } from '../../src/lib/shared-db/db'

const router = Router()

// Login using approval_participants table
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    // Find participant by email
    const participants = await query<any>(
      `SELECT
        ap.id,
        ap.email,
        ap.name,
        ar.advertiser_id,
        a.company_name
       FROM approval_participants ap
       JOIN approval_requests ar ON ar.id = ap.approval_request_id
       JOIN advertisers a ON a.id = ar.advertiser_id
       WHERE ap.email = $1
       LIMIT 1`,
      [email]
    )

    if (participants.length === 0) {
      return res.status(401).json({ error: 'Email not found' })
    }

    const user = participants[0]

    // Simple session (no password for now)
    req.session.userId = user.id
    req.session.userEmail = user.email
    req.session.advertiserId = user.advertiser_id

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        advertiserId: user.advertiser_id,
        companyName: user.company_name,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const participants = await query<any>(
      `SELECT
        ap.id,
        ap.email,
        ap.name,
        ar.advertiser_id,
        a.company_name
       FROM approval_participants ap
       JOIN approval_requests ar ON ar.id = ap.approval_request_id
       JOIN advertisers a ON a.id = ar.advertiser_id
       WHERE ap.id = $1
       LIMIT 1`,
      [req.session.userId]
    )

    if (participants.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = participants[0]

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        advertiserId: user.advertiser_id,
        companyName: user.company_name,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' })
    }
    res.json({ success: true })
  })
})

export default router
```

### Step 2: Update Ads API to Use Existing Tables

**File: `approval-dashboard/api/routes/ads.ts`**

```typescript
import { Router } from 'express'
import { query } from '../../src/lib/shared-db/db'

const router = Router()

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

router.use(requireAuth)

// Get all ads for current advertiser
router.get('/', async (req, res) => {
  try {
    const { status } = req.query
    const advertiserId = req.session.advertiserId

    let statusFilter = ''
    const params: any[] = [advertiserId]

    if (status && status !== 'all') {
      statusFilter = 'AND ar.status = $2'
      params.push(status)
    }

    const ads = await query<any>(
      `SELECT
        a.id,
        a.short_id,
        a.ad_copy,
        ar.status as approval_status,
        ar.tracking_id,
        ar.preview_url,
        a.created_at,
        a.updated_at
       FROM ads a
       JOIN approval_requests ar ON ar.ad_id = a.id
       WHERE ar.advertiser_id = $1
       ${statusFilter}
       ORDER BY a.created_at DESC`,
      params
    )

    res.json({ ads })
  } catch (error) {
    console.error('Get ads error:', error)
    res.status(500).json({ error: 'Failed to fetch ads' })
  }
})

// Get single ad with approval details
router.get('/:id', async (req, res) => {
  try {
    const advertiserId = req.session.advertiserId

    const ads = await query<any>(
      `SELECT
        a.id,
        a.short_id,
        a.ad_copy,
        ar.status as approval_status,
        ar.tracking_id,
        ar.preview_url,
        ar.decision_maker_email,
        ar.decision_maker_name,
        ar.feedback,
        a.created_at,
        a.updated_at
       FROM ads a
       JOIN approval_requests ar ON ar.ad_id = a.id
       WHERE a.id = $1 AND ar.advertiser_id = $2
       LIMIT 1`,
      [req.params.id, advertiserId]
    )

    if (ads.length === 0) {
      return res.status(404).json({ error: 'Ad not found' })
    }

    const ad = ads[0]

    // Get approval activity
    const activity = await query<any>(
      `SELECT
        event_type,
        user_email,
        user_name,
        metadata,
        created_at
       FROM approval_activity
       WHERE approval_request_id = (
         SELECT id FROM approval_requests WHERE ad_id = $1 LIMIT 1
       )
       ORDER BY created_at DESC`,
      [req.params.id]
    )

    res.json({
      ad: {
        ...ad,
        activity,
      },
    })
  } catch (error) {
    console.error('Get ad error:', error)
    res.status(500).json({ error: 'Failed to fetch ad' })
  }
})

// Get approval stats
router.get('/stats/summary', async (req, res) => {
  try {
    const advertiserId = req.session.advertiserId

    const stats = await query<any>(
      `SELECT
        COUNT(*) as total_ads,
        SUM(CASE WHEN ar.status = 'approved' THEN 1 ELSE 0 END) as approved_ads,
        SUM(CASE WHEN ar.status = 'denied' THEN 1 ELSE 0 END) as denied_ads,
        SUM(CASE WHEN ar.status = 'waiting' THEN 1 ELSE 0 END) as pending_ads,
        SUM(CASE WHEN ar.status = 'revision_requested' THEN 1 ELSE 0 END) as revision_ads
       FROM approval_requests ar
       WHERE ar.advertiser_id = $1`,
      [advertiserId]
    )

    res.json({ stats: stats[0] })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router
```

### Step 3: Update Company/Advertiser Profile API

**File: `approval-dashboard/api/routes/profile.ts`**

```typescript
import { Router } from 'express'
import { query } from '../../src/lib/shared-db/db'

const router = Router()

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

router.use(requireAuth)

// Get company/advertiser profile
router.get('/company', async (req, res) => {
  try {
    const advertiserId = req.session.advertiserId

    const companies = await query<any>(
      `SELECT
        id,
        company_name,
        logo_url,
        website,
        facebook_page,
        instagram_account,
        category,
        company_overview,
        created_at
       FROM advertisers
       WHERE id = $1`,
      [advertiserId]
    )

    if (companies.length === 0) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json({ company: companies[0] })
  } catch (error) {
    console.error('Get company error:', error)
    res.status(500).json({ error: 'Failed to fetch company' })
  }
})

// Get all approvers for this advertiser
router.get('/approvers', async (req, res) => {
  try {
    const advertiserId = req.session.advertiserId

    const approvers = await query<any>(
      `SELECT DISTINCT
        ap.id,
        ap.email,
        ap.name,
        ap.is_final_approver,
        ar.created_at
       FROM approval_participants ap
       JOIN approval_requests ar ON ar.id = ap.approval_request_id
       WHERE ar.advertiser_id = $1
       ORDER BY ap.is_final_approver DESC, ap.name ASC`,
      [advertiserId]
    )

    res.json({ approvers })
  } catch (error) {
    console.error('Get approvers error:', error)
    res.status(500).json({ error: 'Failed to fetch approvers' })
  }
})

export default router
```

### Step 4: Update Dashboard Stats API

**File: `approval-dashboard/api/routes/dashboard.ts`** (create new file)

```typescript
import { Router } from 'express'
import { query } from '../../src/lib/shared-db/db'

const router = Router()

const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }
  next()
}

router.use(requireAuth)

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const advertiserId = req.session.advertiserId

    // Get approval stats
    const stats = await query<any>(
      `SELECT
        COUNT(*) as total_ads,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_ads,
        SUM(CASE WHEN status = 'denied' THEN 1 ELSE 0 END) as denied_ads,
        SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as pending_ads,
        SUM(CASE WHEN status = 'revision_requested' THEN 1 ELSE 0 END) as revision_ads
       FROM approval_requests
       WHERE advertiser_id = $1`,
      [advertiserId]
    )

    res.json({ stats: stats[0] })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Get recent activity
router.get('/recent-activity', async (req, res) => {
  try {
    const advertiserId = req.session.advertiserId

    const activity = await query<any>(
      `SELECT
        a.id,
        a.short_id,
        a.ad_copy,
        ar.status,
        ar.created_at,
        ar.updated_at,
        ar.preview_url,
        ar.tracking_id
       FROM ads a
       JOIN approval_requests ar ON ar.ad_id = a.id
       WHERE ar.advertiser_id = $1
       ORDER BY ar.updated_at DESC
       LIMIT 10`,
      [advertiserId]
    )

    res.json({ activity })
  } catch (error) {
    console.error('Get recent activity error:', error)
    res.status(500).json({ error: 'Failed to fetch activity' })
  }
})

export default router
```

### Step 5: Register Dashboard Routes

**File: `approval-dashboard/api/index.ts`**

Add the dashboard routes:

```typescript
import dashboardRoutes from './routes/dashboard'

// ... existing imports ...

// Add this with your other route registrations
app.use('/api/dashboard', dashboardRoutes)
```

## 🧪 Testing the Connection

### 1. Start the Approval Dashboard

```bash
cd ~/approval-dashboard
npm run dev
```

Should start on http://localhost:5174

### 2. Login with Existing Approver Email

Go to http://localhost:5174 and login with any email from the `approval_participants` table.

To see available emails:
```sql
SELECT DISTINCT email, name FROM approval_participants ORDER BY email;
```

### 3. View Dashboard

After login, you should see:
- Total ads count
- Approval status breakdown
- Recent ad activity

### 4. Test Ad Links

When viewing ads, clicking "Review Ad" should redirect to the existing approval email link (using `tracking_id` or `preview_url`).

## 📋 Summary

**What This Setup Does:**
✅ Uses existing database tables (no schema changes needed)
✅ Login with approval participant emails
✅ View ads for their advertiser
✅ See approval status and activity
✅ Click links to review via existing email approval flow
✅ View company/advertiser information

**What It Doesn't Do (Yet):**
❌ Approve/deny directly in dashboard (uses email links)
❌ Campaign grouping (no campaigns table)
❌ Password authentication (simple email-only login)

## 🚀 Next Steps (Optional)

When you're ready to add direct approvals in the dashboard:

1. **Add campaigns table** - Group ads into campaigns
2. **Add approval UI** - Let users approve/deny in dashboard
3. **Add password auth** - Real authentication with bcrypt
4. **Add email notifications** - Send emails when status changes

But for now, this gives you a **working view-only dashboard** using your existing approval flow!
