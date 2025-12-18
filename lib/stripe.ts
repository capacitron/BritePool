import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null

export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
  }
  return stripe
}

export const PRICE_IDS = {
  FREE: null,
  BASIC: process.env.STRIPE_PRICE_BASIC || 'price_basic',
  PREMIUM: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
  PLATINUM: process.env.STRIPE_PRICE_PLATINUM || 'price_platinum',
} as const

export const TIER_PRICES = {
  FREE: 0,
  BASIC: 10,
  PREMIUM: 25,
  PLATINUM: 99,
} as const

export type SubscriptionTier = keyof typeof PRICE_IDS
