import 'dotenv/config'
import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY

if (!apiKey) {
  console.error('RESEND_API_KEY not found in environment')
  process.exit(1)
}

const resend = new Resend(apiKey)

async function testEmail() {
  console.log('Sending test email...')
  console.log('From: BRITE POOL <onboarding@resend.dev>')
  console.log('To: jon@capacitron.com')

  const { data, error } = await resend.emails.send({
    from: 'BRITE POOL <onboarding@resend.dev>',
    to: ['jon@capacitron.com'],
    subject: 'Test Email from BRITE POOL',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a365d;">Email is working!</h1>
        <p>This is a test email from BRITE POOL.</p>
        <p style="color: #666;">Sent at: ${new Date().toISOString()}</p>
      </div>
    `,
  })

  if (error) {
    console.error('Error:', error)
    process.exit(1)
  } else {
    console.log('✅ Success! Email ID:', data?.id)
  }
}

testEmail()
