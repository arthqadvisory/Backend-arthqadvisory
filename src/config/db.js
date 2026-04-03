import mongoose from 'mongoose'

export async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured.')
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    })
    console.log('MongoDB connected')
  } catch (error) {
    throw new Error(
      `MongoDB connection failed. Check that your Atlas cluster is running and your current IP is allowed in Atlas Network Access. Original error: ${error.message}`
    )
  }
}
