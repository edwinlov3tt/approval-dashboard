import { Router, Request, Response } from 'express'
import { query } from '../../src/lib/shared-db/db.js'

const router = Router()

// Login using approval_participants table
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email required' })
    }

    // Find participant by email
    const participants = await query(
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
router.get('/me', async (req: Request, res: Response) => {
  try {
    const { email } = req.query

    if (!email) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const participants = await query(
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
router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true })
})

export default router
