// Check for existing users in the database
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function checkUsers() {
  try {
    console.log('👥 Checking for existing users...\n')

    // Check advertiser_stakeholders (might be the user table)
    try {
      const stakeholders = await pool.query(`
        SELECT id, first_name, last_name, email, phone, advertiser_id
        FROM advertiser_stakeholders
        LIMIT 10
      `)

      console.log(`Found ${stakeholders.rows.length} stakeholders:\n`)

      if (stakeholders.rows.length > 0) {
        stakeholders.rows.forEach(user => {
          console.log(`📧 Email: ${user.email}`)
          console.log(`   Name: ${user.first_name} ${user.last_name}`)
          console.log(`   Advertiser ID: ${user.advertiser_id}`)
          console.log(`   ID: ${user.id}`)
          console.log()
        })

        console.log('✅ You can login with any of these emails!')
        console.log('💡 Password can be anything (validation not implemented yet)\n')
      } else {
        console.log('⚠️  No stakeholders found\n')
      }
    } catch (err) {
      console.log('❌ Error reading stakeholders:', err.message)
    }

    // Check advertisers
    console.log('\n🏢 Available advertisers:')
    const advertisers = await pool.query('SELECT id, company_name FROM advertisers LIMIT 5')

    if (advertisers.rows.length > 0) {
      advertisers.rows.forEach(adv => {
        console.log(`  ID: ${adv.id} - ${adv.company_name}`)
      })
    } else {
      console.log('  No advertisers found')
    }

    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkUsers()
