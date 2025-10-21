import { Router, Request, Response } from 'express'
import { query, queryOne } from '../../src/lib/shared-db/db.js'

const router = Router()

// Get company/advertiser profile
router.get('/company', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const company = await queryOne(
      `SELECT
        id,
        company_name,
        logo_url,
        website,
        facebook_page,
        facebook_page_id,
        instagram_account,
        category,
        company_overview,
        created_at
      FROM advertisers
      WHERE id = $1`,
      [advertiserId]
    )

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json({ company })
  } catch (error) {
    console.error('Get company profile error:', error)
    res.status(500).json({ error: 'Failed to fetch company profile' })
  }
})

// Get all approvers for this advertiser
router.get('/approvers', async (req: Request, res: Response) => {
  try {
    const { advertiserId } = req.query

    if (!advertiserId) {
      return res.status(400).json({ error: 'advertiserId required' })
    }

    const approvers = await query(
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

// Update company profile
router.patch('/company/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const {
      company_name,
      logo_url,
      website,
      facebook_page,
      facebook_page_id,
      instagram_account,
      category,
      company_overview
    } = req.body

    const company = await queryOne(
      `UPDATE advertisers
       SET company_name = COALESCE($1, company_name),
           logo_url = COALESCE($2, logo_url),
           website = COALESCE($3, website),
           facebook_page = COALESCE($4, facebook_page),
           facebook_page_id = COALESCE($5, facebook_page_id),
           instagram_account = COALESCE($6, instagram_account),
           category = COALESCE($7, category),
           company_overview = COALESCE($8, company_overview),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9
       RETURNING *`,
      [
        company_name,
        logo_url,
        website,
        facebook_page,
        facebook_page_id,
        instagram_account,
        category,
        company_overview,
        id
      ]
    )

    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json({ company })
  } catch (error) {
    console.error('Update company profile error:', error)
    res.status(500).json({ error: 'Failed to update company profile' })
  }
})

export default router
