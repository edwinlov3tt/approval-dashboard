// Create a test user for login
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function createTestUser() {
  try {
    console.log('📝 Creating test user...\n')

    // First check if advertiser exists
    const advertiser = await pool.query(
      'SELECT id, username FROM advertisers LIMIT 1'
    )

    if (advertiser.rows.length === 0) {
      console.log('❌ No advertisers found in database')
      console.log('Please create an advertiser first')
      await pool.end()
      return
    }

    const advertiserId = advertiser.rows[0].id
    const advertiserName = advertiser.rows[0].username

    console.log(`Found advertiser: ${advertiserName} (ID: ${advertiserId})`)

    // Check if test user already exists
    const existing = await pool.query(
      "SELECT * FROM advertiser_stakeholders WHERE email = 'test@approval.com'"
    )

    if (existing.rows.length > 0) {
      console.log('\n✓ Test user already exists!')
      console.log('\n🔑 Login Credentials:')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('Email:    test@approval.com')
      console.log('Password: (any password works)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      await pool.end()
      return
    }

    // Create test user
    const result = await pool.query(
      `INSERT INTO advertiser_stakeholders
       (advertiser_id, name, email, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [advertiserId, 'Test User', 'test@approval.com', 'admin']
    )

    console.log('\n✅ Test user created successfully!\n')
    console.log('🔑 Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Email:    test@approval.com')
    console.log('Password: (any password works)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    console.log('User Details:')
    console.log(`  ID: ${result.rows[0].id}`)
    console.log(`  Name: ${result.rows[0].name}`)
    console.log(`  Advertiser ID: ${result.rows[0].advertiser_id}`)
    console.log(`  Role: ${result.rows[0].role}\n`)

    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    await pool.end()
    process.exit(1)
  }
}

createTestUser()
