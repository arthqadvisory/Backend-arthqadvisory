import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDatabase } from './config/db.js'
import inquiryRoutes from './routes/inquiries.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const backendRoot = resolve(__dirname, '..')
const workspaceRoot = resolve(backendRoot, '..')

dotenv.config({ path: resolve(backendRoot, '.env') })
dotenv.config({ path: resolve(workspaceRoot, '.env'), override: false })

const app = express()
const port = process.env.PORT || 5001
const mongoUri = process.env.MONGODB_URI
const allowedOrigins = (
  process.env.CLIENT_URLS ||
  process.env.CLIENT_URL ||
  'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173,http://localhost:3000,http://127.0.0.1:3000'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204)
  }

  return next()
})

app.use(
  cors({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type']
  })
)
app.options('*', cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/inquiries', inquiryRoutes)

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
