import { Router } from 'express'
import { sendInquiryNotification } from '../lib/mailer.js'
import { Inquiry } from '../models/Inquiry.js'
import { validateInquiryPayload } from '../utils/validation.js'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const { errors, sanitized } = await validateInquiryPayload(req.body)

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: 'Please correct the invalid fields.',
        errors
      })
    }

    const { name, email, phone, service, message } = sanitized

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      service,
      message
    })

    let emailResult = {
      sent: false,
      reason: 'Email delivery was not attempted.'
    }

    try {
      emailResult = await sendInquiryNotification({
        name,
        email,
        phone,
        service,
        message
      })
    } catch (emailError) {
      console.error('Error sending inquiry email:', emailError)
      emailResult = {
        sent: false,
        reason: emailError.message || 'Unable to send inquiry email.'
      }
    }

    return res.status(201).json({
      message: emailResult.sent
        ? 'Inquiry created successfully.'
        : 'Inquiry created successfully, but email delivery failed.',
      inquiry,
      emailSent: emailResult.sent,
      ...(process.env.NODE_ENV !== 'production' && emailResult.reason ? { emailError: emailResult.reason } : {})
    })
  } catch (error) {
    console.error('Error creating inquiry:', error)
    return res.status(500).json({
      message: 'Server error while creating inquiry.',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    })
  }
})

router.get('/', async (_req, res) => {
  try {
    const inquiries = await Inquiry.find().sort({ createdAt: -1 }).lean()
    return res.json(inquiries)
  } catch (error) {
    console.error('Error fetching inquiries:', error)
    return res.status(500).json({
      message: 'Server error while fetching inquiries.',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    })
  }
})

export default router
