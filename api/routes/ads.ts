import { Router, Request, Response } from 'express'
import { query, queryOne } from '../../src/lib/shared-db/db.js'

const router = Router()

// Get all ads for an advertiser
router.get('/', async (req: Request, res: Response) => {
  try {
    const { advertiserId, status } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    let statusFilter = ''
    const params: any[] = [advertiserId]

    if (status && status !== 'all') {
      statusFilter = 'AND ar.status = $2'
      params.push(status)
    }

    const ads = await query(
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

    // Format ads to match frontend expectations
    const formattedAds = ads.map((ad: any) => ({
      id: ad.id,
      short_id: ad.short_id,
      name: ad.ad_copy?.adName || 'Untitled Ad',
      description: ad.ad_copy?.description || '',
      format: ad.ad_copy?.format || 'Banner',
      dimensions: ad.ad_copy?.dimensions || '1200x628',
      status: ad.approval_status || 'waiting',
      tracking_id: ad.tracking_id,
      preview_url: ad.preview_url,
      created_at: ad.created_at,
    }))

    res.json({ ads: formattedAds })
  } catch (error) {
    console.error('Get ads error:', error)
    res.status(500).json({ error: 'Failed to fetch ads' })
  }
})

// Get single ad with approval details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const ad = await queryOne(
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

    if (!ad) {
      return res.status(404).json({ error: 'Ad not found' })
    }

    // Get approval activity
    const activity = await query(
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
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const stats = await query(
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
