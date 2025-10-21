import { Router, Request, Response } from 'express'
import { query, queryOne } from '../../src/lib/shared-db/db.js'

const router = Router()

// Get all approvers for an advertiser
router.get('/', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    // Get user profiles that are approvers for this advertiser
    const approvers = await query(
      `SELECT
        up.id,
        up.first_name,
        up.last_name,
        up.email,
        up.phone,
        up.is_on_vacation,
        up.created_at,
        CASE
          WHEN up.is_on_vacation THEN 'pending'
          ELSE 'active'
        END as status,
        false as is_decision_maker
      FROM user_profiles up
      WHERE up.advertiser_id = $1
      ORDER BY up.created_at DESC`,
      [advertiserId]
    )

    res.json({ approvers })
  } catch (error) {
    console.error('Get approvers error:', error)
    res.status(500).json({ error: 'Failed to fetch approvers' })
  }
})

// Invite/add new approver
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      advertiserId,
      first_name,
      last_name,
      email,
      phone,
      is_decision_maker
    } = req.body

    if (!advertiserId || !email || !first_name || !last_name) {
      return res.status(400).json({
        error: 'advertiserId, email, first_name, and last_name required'
      })
    }

    // Check if user already exists
    const existing = await queryOne(
      'SELECT id FROM user_profiles WHERE email = $1',
      [email]
    )

    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Create new user profile
    const approver = await queryOne(
      `INSERT INTO user_profiles
       (advertiser_id, first_name, last_name, email, phone, email_verified, is_on_vacation)
       VALUES ($1, $2, $3, $4, $5, false, false)
       RETURNING
         id,
         first_name,
         last_name,
         email,
         phone,
         is_on_vacation,
         created_at,
         'pending' as status`,
      [advertiserId, first_name, last_name, email, phone]
    )

    res.status(201).json({ approver })
  } catch (error) {
    console.error('Add approver error:', error)
    res.status(500).json({ error: 'Failed to add approver' })
  }
})

// Remove approver
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await query('DELETE FROM user_profiles WHERE id = $1', [id])

    res.json({ success: true })
  } catch (error) {
    console.error('Remove approver error:', error)
    res.status(500).json({ error: 'Failed to remove approver' })
  }
})

export default router
