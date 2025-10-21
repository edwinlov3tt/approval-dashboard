# Database Integration Completion Guide

## ✅ Completed

### Backend (API Server)
- ✓ API server running on http://localhost:3001
- ✓ Database connected successfully
- ✓ Express routes created:
  - `/api/auth` - Authentication (simple validation)
  - `/api/campaigns` - Campaign CRUD + stats + recent activity
  - `/api/ads` - Ad listing and details
  - `/api/approvers` - Approver management
  - `/api/profile` - User and company profile

### Frontend Setup
- ✓ API client utility (`src/lib/api.js`)
- ✓ Loading spinner component
- ✓ Error message component
- ✓ Auth context updated to use API
- ✓ Login page updated
- ✓ **Dashboard page fully integrated** ← Working example!

## 🔄 Remaining Components to Update

Follow the same pattern as Dashboard.jsx for these components:

### 1. Campaigns Page (`src/pages/campaigns/Campaigns.jsx`)

**Changes needed:**
```javascript
// Add imports
import { useEffect } from 'react'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import ErrorMessage from '../../components/ui/ErrorMessage'
import { useAuth } from '../../lib/auth'
import { api } from '../../lib/api'

// Add state
const { user } = useAuth()
const [campaigns, setCampaigns] = useState([])
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState(null)

// Add useEffect
useEffect(() => {
  if (user?.advertiserId) {
    fetchCampaigns()
  }
}, [user])

// Add fetch function
const fetchCampaigns = async () => {
  setIsLoading(true)
  setError(null)
  try {
    const data = await api.campaigns.getAll(user.advertiserId)
    setCampaigns(data.campaigns || [])
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}

// Update sorting to use `campaigns` instead of `mockCampaigns`

// Add loading/error states before return
if (isLoading) return <Layout><LoadingSpinner /></Layout>
if (error) return <Layout><ErrorMessage message={error} onRetry={fetchCampaigns} /></Layout>
```

### 2. Ads Page (`src/pages/ads/Ads.jsx`)

**Changes needed:**
```javascript
// Same pattern as above
const fetchAds = async () => {
  setIsLoading(true)
  setError(null)
  try {
    const data = await api.ads.getAll(user.advertiserId, {
      campaignId: filter !== 'all' ? selectedCampaignId : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined
    })
    setAds(data.ads || [])
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}

// Call fetchAds whenever filters change
useEffect(() => {
  if (user?.advertiserId) {
    fetchAds()
  }
}, [user, filter, statusFilter])
```

### 3. Business Profile Page (`src/pages/business-profile/BusinessProfile.jsx`)

**Changes needed:**
```javascript
// Fetch both company info and approvers
const fetchBusinessProfile = async () => {
  setIsLoading(true)
  setError(null)
  try {
    const [companyData, approversData] = await Promise.all([
      api.profile.getCompany(user.advertiserId),
      api.approvers.getAll(user.advertiserId)
    ])
    setCompanyInfo(companyData.company)
    setApprovers(approversData.approvers || [])
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}

// Update invite handler
const handleInviteApprover = async () => {
  try {
    const data = await api.approvers.invite({
      advertiserId: user.advertiserId,
      ...inviteForm
    })

    if (data.approver) {
      setApprovers([...approvers, data.approver])
      setIsInviteModalOpen(false)
      // Reset form
    }
  } catch (err) {
    console.error('Failed to invite approver:', err)
    alert('Failed to invite approver: ' + err.message)
  }
}

// Update remove handler
const handleRemoveApprover = async (id) => {
  if (!confirm('Are you sure you want to remove this approver?')) return

  try {
    await api.approvers.remove(id)
    setApprovers(approvers.filter((a) => a.id !== id))
  } catch (err) {
    console.error('Failed to remove approver:', err)
    alert('Failed to remove approver: ' + err.message)
  }
}

// Update company info save
const handleSaveCompanyInfo = async () => {
  try {
    await api.profile.updateCompany(user.advertiserId, companyInfo)
    alert('Company profile updated successfully')
  } catch (err) {
    alert('Failed to update profile: ' + err.message)
  }
}
```

### 4. Profile Page (`src/pages/profile/Profile.jsx`)

**Changes needed:**
```javascript
const fetchUserProfile = async () => {
  setIsLoading(true)
  setError(null)
  try {
    const data = await api.profile.getUser(user.id)
    setUserInfo(data.user)
  } catch (err) {
    setError(err.message)
  } finally {
    setIsLoading(false)
  }
}

const handleSaveProfile = async () => {
  try {
    await api.profile.updateUser(user.id, userInfo)
    alert('Profile updated successfully')
  } catch (err) {
    alert('Failed to update profile: ' + err.message)
  }
}
```

## 📝 Quick Reference: API Methods

All available via `import { api } from '../lib/api'`:

### Campaigns
- `api.campaigns.getAll(advertiserId)`
- `api.campaigns.getOne(id, advertiserId)`
- `api.campaigns.getStats(advertiserId)`
- `api.campaigns.getRecent(advertiserId)`
- `api.campaigns.create(data)`
- `api.campaigns.update(id, data)`
- `api.campaigns.delete(id)`

### Ads
- `api.ads.getAll(advertiserId, { campaignId?, status? })`
- `api.ads.getOne(id)`

### Approvers
- `api.approvers.getAll(advertiserId)`
- `api.approvers.invite(data)`
- `api.approvers.remove(id)`

### Profile
- `api.profile.getUser(userId)`
- `api.profile.getCompany(advertiserId)`
- `api.profile.updateUser(id, data)`
- `api.profile.updateCompany(id, data)`

### Auth
- `api.auth.login(email, password)`
- `api.auth.logout()`

## 🧪 Testing the Integration

### 1. Test Database Connection
Visit http://localhost:3001/health - should return `{"status":"ok"}`

### 2. Test Login
- Use any email that exists in the `user_profiles` table
- Password can be anything (validation not implemented yet)

### 3. View Dashboard
- After login, dashboard should show real campaign stats
- Recent activity table should display actual ads from database

### 4. Check Browser Console
- Should see API requests in Network tab
- Check for any CORS or fetch errors

### 5. Verify Database Updates
When you add/edit/delete items:
- Check that changes persist after page refresh
- Verify changes in database if you have access

## 🐛 Troubleshooting

### API Connection Errors
- Check that API server is running on port 3001
- Verify DATABASE_URL in `.env` is correct
- Check browser console for CORS errors

### Data Not Loading
- Verify `user.advertiserId` is set after login
- Check API responses in Network tab
- Look for errors in API server console

### Database Errors
- Check API server console for SQL errors
- Verify table/column names match the queries
- Ensure user has correct advertiser_id

## 🎯 Next Steps After Integration

1. **Add Form Validation**
   - Client-side validation before API calls
   - Display validation errors from API

2. **Implement Real Authentication**
   - Add bcrypt password hashing
   - Add session-based auth with express-session
   - Add email verification

3. **Add Campaign Creation Flow**
   - Build campaign creation form
   - Add ad upload functionality
   - Connect to approval workflow

4. **Polish UI/UX**
   - Add success toast notifications
   - Improve error handling
   - Add confirmation dialogs

5. **Deploy**
   - Set up production database
   - Deploy API server
   - Deploy frontend
   - Configure environment variables

## 📚 Reference Files

**Working Examples:**
- `src/pages/dashboard/Dashboard.jsx` - Full integration example
- `src/lib/api.js` - API client methods
- `api/routes/campaigns.ts` - Backend route example

**Utilities:**
- `src/components/ui/LoadingSpinner.jsx`
- `src/components/ui/ErrorMessage.jsx`
- `src/lib/auth.jsx` - Auth context with API

## 💾 Database Schema Reference

The API expects these tables:
- `campaigns` - Campaign data
- `campaign_ads` - Ads in campaigns
- `ads` - Ad details and approval status
- `user_profiles` - User accounts
- `advertisers` - Company/business profiles

See `/src/lib/shared-db/types.ts` for full TypeScript types.

---

**Current Status:** Dashboard is fully integrated and working! Follow the patterns above to complete the remaining pages.
