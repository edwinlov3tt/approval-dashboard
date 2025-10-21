import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Import routes
import authRoutes from './routes/auth.js'
import campaignRoutes from './routes/campaigns.js'
import adRoutes from './routes/ads.js'
import approverRoutes from './routes/approvers.js'
import profileRoutes from './routes/profile.js'
import dashboardRoutes from './routes/dashboard.js'

dotenv.config()

const app = express()
const PORT = process.env.API_PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/campaigns', campaignRoutes)
app.use('/api/ads', adRoutes)
app.use('/api/approvers', approverRoutes)
app.use('/api/profile', profileRoutes)
app.use('/api/dashboard', dashboardRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`✓ API server running on http://localhost:${PORT}`)
  console.log(`✓ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`)
})
