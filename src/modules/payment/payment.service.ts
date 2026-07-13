import AppError from '../../errors/AppError';
import config from '../../config';
import { TTokenPayload } from '../../shared/jwt';
import prisma from '../../shared/prisma';
import stripe from '../../shared/stripe';

// ---------- CREATE CHECKOUT SESSION ----------

const createCheckoutSession = async (
  tenantId: string,
  rentalRequestId: string
) => {
  const rental = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: {
      property: { select: { id: true, title: true, location: true, rentAmount: true } },
      payment: true,
    },
  });

  if (!rental) {
    throw new AppError(404, 'Rental request not found');
  }

  if (rental.tenantId !== tenantId) {
    throw new AppError(403, 'You can only pay for your own rental requests');
  }

  // Payment is only possible AFTER the landlord approved (flow diagram:
  // APPROVED -> PAYMENT -> ACTIVE). Reject every other state clearly.
  if (rental.status !== 'APPROVED') {
    throw new AppError(
      400,
      `Payment is only possible for APPROVED requests (current status: ${rental.status})`
    );
  }

  if (rental.payment?.status === 'COMPLETED') {
    throw new AppError(400, 'This rental request is already paid');
  }

  // Create the Stripe-hosted checkout page.
  // Stripe amounts are in the smallest currency unit (cents), so *100.
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: rental.property.title,
            description: `First month's rent - ${rental.property.location}`,
          },
          unit_amount: rental.property.rentAmount * 100,
        },
        quantity: 1,
      },
    ],
    metadata: { rentalRequestId: rental.id, tenantId },
    success_url: `${config.server_url}/api/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.server_url}/api/payments/cancel`,
  });

  // Track the payment in OUR database from the very beginning (PENDING).
  // upsert: first attempt creates the row, a retry updates it with the
  // new session id (a rental has at most ONE payment row - 1:1 relation).
  const payment = await prisma.payment.upsert({
    where: { rentalRequestId: rental.id },
    create: {
      transactionId: session.id,
      amount: rental.property.rentAmount,
      currency: 'usd',
      provider: 'STRIPE',
      status: 'PENDING',
      rentalRequestId: rental.id,
      tenantId,
    },
    update: { transactionId: session.id, status: 'PENDING' },
  });

  return {
    paymentId: payment.id,
    checkoutUrl: session.url,
    message: 'Open checkoutUrl in a browser to pay (test card: 4242 4242 4242 4242)',
  };
};

// ---------- FULFILLMENT (shared by success redirect + webhook) ----------

const fulfillPayment = async (sessionId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId: sessionId },
    include: { rentalRequest: { select: { id: true, propertyId: true } } },
  });

  if (!payment) {
    throw new AppError(404, 'No payment record found for this session');
  }

  // Idempotent: success redirect AND webhook may both call this
  if (payment.status === 'COMPLETED') {
    return { alreadyProcessed: true, payment };
  }

  // Never trust the redirect alone - ask Stripe's server if it was paid
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new AppError(
      400,
      `Payment not completed (Stripe status: ${session.payment_status})`
    );
  }

  // Three records must change together: payment, rental, property
  const [updatedPayment] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED', paidAt: new Date() },
    }),
    prisma.rentalRequest.update({
      where: { id: payment.rentalRequest.id },
      data: { status: 'ACTIVE' },
    }),
    prisma.property.update({
      where: { id: payment.rentalRequest.propertyId },
      data: { availability: 'RENTED' },
    }),
  ]);

  return { alreadyProcessed: false, payment: updatedPayment };
};

// ---------- STRIPE WEBHOOK ----------

const handleWebhookEvent = async (rawBody: Buffer, signature: string) => {
  if (!config.stripe_webhook_secret) {
    throw new AppError(500, 'Stripe webhook secret is not configured');
  }

  // Throws if the signature is invalid - proves the call came from Stripe
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    config.stripe_webhook_secret
  );

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await fulfillPayment(session.id);
  }

  return { received: true, type: event.type };
};

// ---------- HISTORY ----------

const getMyPayments = async (tenantId: string) => {
  return prisma.payment.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: {
      rentalRequest: {
        select: {
          id: true,
          status: true,
          property: { select: { title: true, location: true } },
        },
      },
    },
  });
};

const getPaymentById = async (paymentId: string, user: TTokenPayload) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      rentalRequest: {
        select: {
          id: true,
          status: true,
          moveInDate: true,
          property: {
            select: { id: true, title: true, location: true, landlordId: true },
          },
        },
      },
      tenant: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) {
    throw new AppError(404, 'Payment not found');
  }

  const isTenantOwner = payment.tenantId === user.userId;
  const isPropertyLandlord =
    payment.rentalRequest.property.landlordId === user.userId;
  const isAdmin = user.role === 'ADMIN';

  if (!isTenantOwner && !isPropertyLandlord && !isAdmin) {
    throw new AppError(403, 'You are not allowed to view this payment');
  }

  return payment;
};

export const PaymentService = {
  createCheckoutSession,
  fulfillPayment,
  handleWebhookEvent,
  getMyPayments,
  getPaymentById,
};
