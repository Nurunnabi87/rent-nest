import Stripe from 'stripe';
import config from '../config';

// Single Stripe client for the whole app (same idea as the Prisma singleton)
const stripe = new Stripe(config.stripe_secret_key);

export default stripe;
