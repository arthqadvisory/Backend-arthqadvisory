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
const corsOptions = {
  origin(origin, callback) {
    // Allow server-to-server requests and tools like curl/postman with no Origin header.
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
}

app.use(
  cors(corsOptions)
)
app.options('*', cors(corsOptions))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/inquiries', inquiryRoutes)

connectDatabase(mongoUri)
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on 0.0.0.0:${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server', error)
    process.exit(1)
  })
