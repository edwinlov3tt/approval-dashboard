import { Router, Request, Response } from 'express'
import { query, queryOne } from '../../src/lib/shared-db/db.js'

const router = Router()

// Get all campaigns for an advertiser
router.get('/', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const campaigns = await query(
      `SELECT
        c.id,
        c.advertiser_id,
        c.name,
        c.description,
        c.status,
        c.start_date,
        c.end_date,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT ca.ad_id) as total_ads,
        COUNT(DISTINCT CASE WHEN a.approval_status = 'approved' THEN ca.ad_id END) as approved_ads,
        COUNT(DISTINCT CASE WHEN a.approval_status = 'denied' THEN ca.ad_id END) as denied_ads,
        COUNT(DISTINCT CASE WHEN a.approval_status = 'waiting' OR a.approval_status IS NULL THEN ca.ad_id END) as pending_ads
      FROM campaigns c
      LEFT JOIN campaign_ads ca ON c.id = ca.campaign_id
      LEFT JOIN ads a ON ca.ad_id = a.id
      WHERE c.advertiser_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC`,
      [advertiserId]
    )

    res.json({ campaigns })
  } catch (error) {
    console.error('Get campaigns error:', error)
    res.status(500).json({ error: 'Failed to fetch campaigns' })
  }
})

// Get dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const stats = await queryOne(
      `SELECT
        COUNT(DISTINCT c.id) as total_campaigns,
        COUNT(DISTINCT CASE WHEN c.status = 'in_progress' THEN c.id END) as active_campaigns,
        COUNT(DISTINCT CASE WHEN a.approval_status = 'waiting' THEN a.id END) as pending_approvals,
        COUNT(DISTINCT CASE
          WHEN a.approval_status = 'approved'
          AND DATE_TRUNC('month', a.updated_at) = DATE_TRUNC('month', CURRENT_DATE)
          THEN a.id
        END) as approved_this_month
      FROM campaigns c
      LEFT JOIN campaign_ads ca ON c.id = ca.campaign_id
      LEFT JOIN ads a ON ca.ad_id = a.id
      WHERE c.advertiser_id = $1`,
      [advertiserId]
    )

    res.json(stats || {
      total_campaigns: 0,
      active_campaigns: 0,
      pending_approvals: 0,
      approved_this_month: 0
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// Get recent activity
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const activity = await query(
      `SELECT
        a.id,
        a.short_id,
        a.ad_copy->>'adName' as ad_name,
        c.name as campaign_name,
        a.approval_status as status,
        a.updated_at as date
      FROM ads a
      JOIN campaign_ads ca ON a.id = ca.ad_id
      JOIN campaigns c ON ca.campaign_id = c.id
      WHERE c.advertiser_id = $1
      ORDER BY a.updated_at DESC
      LIMIT 10`,
      [advertiserId]
    )

    res.json({ activity })
  } catch (error) {
    console.error('Get recent activity error:', error)
    res.status(500).json({ error: 'Failed to fetch recent activity' })
  }
})

// Get single campaign with ads
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { advertiserId } = req.query

    const campaign = await queryOne(
      `SELECT
        c.id,
        c.advertiser_id,
        c.name,
        c.description,
        c.status,
        c.start_date,
        c.end_date,
        c.created_at,
        c.updated_at
      FROM campaigns c
      WHERE c.id = $1 AND c.advertiser_id = $2`,
      [id, advertiserId]
    )

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Get ads for this campaign
    const ads = await query(
      `SELECT
        a.id,
        a.short_id,
        a.ad_copy,
        a.approval_status,
        a.created_at
      FROM ads a
      JOIN campaign_ads ca ON a.id = ca.ad_id
      WHERE ca.campaign_id = $1
      ORDER BY ca.display_order, a.created_at`,
      [id]
    )

    res.json({ campaign: { ...campaign, ads } })
  } catch (error) {
    console.error('Get campaign error:', error)
    res.status(500).json({ error: 'Failed to fetch campaign' })
  }
})

// Create campaign
router.post('/', async (req: Request, res: Response) => {
  try {
    const { advertiserId, name, description, start_date, end_date } = req.body

    if (!advertiserId || !name) {
      return res.status(400).json({ error: 'advertiserId and name required' })
    }

    const campaign = await queryOne(
      `INSERT INTO campaigns (advertiser_id, name, description, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'waiting')
       RETURNING *`,
      [advertiserId, name, description, start_date, end_date]
    )

    res.status(201).json({ campaign })
  } catch (error) {
    console.error('Create campaign error:', error)
    res.status(500).json({ error: 'Failed to create campaign' })
  }
})

// Update campaign
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { name, description, start_date, end_date, status } = req.body

    const campaign = await queryOne(
      `UPDATE campaigns
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           status = COALESCE($5, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [name, description, start_date, end_date, status, id]
    )

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    res.json({ campaign })
  } catch (error) {
    console.error('Update campaign error:', error)
    res.status(500).json({ error: 'Failed to update campaign' })
  }
})

// Delete campaign
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    await query('DELETE FROM campaigns WHERE id = $1', [id])

    res.json({ success: true })
  } catch (error) {
    console.error('Delete campaign error:', error)
    res.status(500).json({ error: 'Failed to delete campaign' })
  }
})

export default router
