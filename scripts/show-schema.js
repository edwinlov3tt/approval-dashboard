// Show actual database schema
import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function showSchema() {
  try {
    console.log('📊 Database Schema\n')

    const tables = ['advertisers', 'advertiser_stakeholders', 'ads']

    for (const tableName of tables) {
      console.log(`\n━━━ ${tableName.toUpperCase()} ━━━`)

      const columns = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName])

      if (columns.rows.length > 0) {
        columns.rows.forEach(col => {
          console.log(`  ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
        })

        // Show sample data
        console.log(`\n  Sample data:`)
        const sample = await pool.query(`SELECT * FROM ${tableName} LIMIT 1`)
        if (sample.rows.length > 0) {
          console.log(JSON.stringify(sample.rows[0], null, 2))
        } else {
          console.log('  (no data)')
        }
      } else {
        console.log('  Table not found')
      }
    }

    await pool.end()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

showSchema()
