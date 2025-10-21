// Quick script to check what exists in the database
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...\n')

    // Test connection
    const testResult = await pool.query('SELECT NOW()')
    console.log('✓ Database connected successfully')
    console.log('✓ Current time:', testResult.rows[0].now)
    console.log()

    // List all tables
    console.log('📋 Existing tables:')
    const tables = await pool.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)

    if (tables.rows.length === 0) {
      console.log('  ⚠️  No tables found in database')
    } else {
      tables.rows.forEach(row => {
        console.log(`  - ${row.tablename}`)
      })
    }
    console.log()

    // Check for specific tables we need
    console.log('🔎 Checking for required tables:')
    const requiredTables = ['advertisers', 'user_profiles', 'campaigns', 'ads', 'campaign_ads']

    for (const tableName of requiredTables) {
      const exists = tables.rows.some(row => row.tablename === tableName)
      console.log(`  ${exists ? '✓' : '✗'} ${tableName}`)
    }
    console.log()

    // Check if there are any users
    try {
      const userCount = await pool.query('SELECT COUNT(*) FROM user_profiles')
      console.log(`👥 User profiles found: ${userCount.rows[0].count}`)

      if (parseInt(userCount.rows[0].count) > 0) {
        console.log('\n📧 Sample user emails:')
        const users = await pool.query('SELECT email, first_name, last_name FROM user_profiles LIMIT 5')
        users.rows.forEach(user => {
          console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`)
        })
      }
    } catch (err) {
      console.log('⚠️  user_profiles table does not exist')
    }

    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkDatabase()
