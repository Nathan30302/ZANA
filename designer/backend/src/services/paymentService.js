// Payment processing service for ZANA
// Supports integration with Stripe, PayPal, MTN Mobile Money, Airtel Money, ZWL, etc.

class PaymentService {
  constructor() {
    this.providers = {
      stripe: process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null,
      // Add other payment providers as needed
    };
  }

  // Process payment with Stripe
  async processStripePayment(amount, currency, customerId, paymentMethodId) {
    if (!this.providers.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const paymentIntent = await this.providers.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
      });

      return {
        success: paymentIntent.status === 'succeeded',
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
      };
    } catch (error) {
      console.error('Stripe payment error:', error);
      throw error;
    }
  }

  // Create payment intent (for Stripe)
  async createPaymentIntent(amount, currency = 'USD', metadata = {}) {
    if (!this.providers.stripe) {
      throw new Error('Stripe not configured');
    }

    try {
      const paymentIntent = await this.providers.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata,
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: paymentIntent.amount / 100,
      };
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPayment(paymentId, provider = 'stripe') {
    if (provider === 'stripe' && this.providers.stripe) {
      try {
        const paymentIntent = await this.providers.stripe.paymentIntents.retrieve(paymentId);
        return {
          success: paymentIntent.status === 'succeeded',
          status: paymentIntent.status,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
        };
      } catch (error) {
        console.error('Error verifying payment:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: 'Provider not supported' };
  }

  // Refund payment
  async refundPayment(paymentId, amount = null, provider = 'stripe') {
    if (provider === 'stripe' && this.providers.stripe) {
      try {
        const refund = await this.providers.stripe.refunds.create({
          payment_intent: paymentId,
          amount: amount ? Math.round(amount * 100) : undefined,
        });

        return {
          success: refund.status === 'succeeded',
          refundId: refund.id,
          amount: refund.amount / 100,
        };
      } catch (error) {
        console.error('Refund error:', error);
        throw error;
      }
    }
    throw new Error('Provider not supported');
  }

  // Generate invoice for booking
  async generateInvoice(booking, venue, service) {
    const invoice = {
      reference: `INV-${Date.now()}`,
      bookingReference: booking.reference || booking.id,
      date: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      customer: {
        name: booking.customer?.firstName + ' ' + booking.customer?.lastName,
        email: booking.customer?.email,
        phone: booking.customer?.phone,
      },
      service: {
        name: service.name,
        duration: service.duration,
        price: service.price,
        description: service.description,
      },
      venue: {
        name: venue.name,
        address: venue.address,
        city: venue.city,
      },
      bookingDetails: {
        date: booking.date,
        startTime: booking.startTime,
        status: booking.status,
      },
      subtotal: service.price,
      tax: Math.round(service.price * 0.1 * 100) / 100, // 10% tax
      total: Math.round((service.price * 1.1) * 100) / 100,
      notes: booking.notes || '',
      paymentStatus: booking.paymentStatus || 'PENDING',
    };

    return invoice;
  }

  // Calculate pricing with tax and fees
  calculatePricing(servicePrice, taxRate = 0.1, platformFee = 0.05) {
    const subtotal = servicePrice;
    const tax = Math.round(subtotal * taxRate * 100) / 100;
    const platformFeeAmount = Math.round(subtotal * platformFee * 100) / 100;
    const total = subtotal + tax + platformFeeAmount;

    return {
      servicePrice,
      tax,
      platformFee: platformFeeAmount,
      total,
      breakdown: {
        'Service Price': servicePrice,
        'Tax (10%)': tax,
        'Platform Fee (5%)': platformFeeAmount,
        'Total': total,
      },
    };
  }
}

module.exports = new PaymentService();
