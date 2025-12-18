import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier as 'BASIC' | 'PREMIUM' | 'PLATINUM'

        if (userId && tier) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: tier,
              subscriptionStatus: 'ACTIVE',
            },
          })
          console.log(`User ${userId} subscription activated: ${tier}`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          let status: 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'INACTIVE' = 'ACTIVE'
          
          if (subscription.status === 'past_due') {
            status = 'PAST_DUE'
          } else if (subscription.status === 'canceled' || subscription.status === 'unpaid') {
            status = 'CANCELLED'
          } else if (subscription.status === 'active') {
            status = 'ACTIVE'
          } else {
            status = 'INACTIVE'
          }

          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: status,
            },
          })
          console.log(`User ${userId} subscription status updated: ${status}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionTier: 'FREE',
              subscriptionStatus: 'CANCELLED',
            },
          })
          console.log(`User ${userId} subscription cancelled, reverted to FREE`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
