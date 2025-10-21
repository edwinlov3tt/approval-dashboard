import { Router, Request, Response } from 'express'
import { query } from '../../src/lib/shared-db/db.js'

const router = Router()

// Get dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    // Get approval stats
    const stats = await query(
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
router.get('/recent-activity', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const activity = await query(
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
