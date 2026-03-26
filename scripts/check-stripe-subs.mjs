import 'dotenv/config';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || process.env.public_api_stripe;
if (!key) {
  console.log('No se encontró STRIPE_SECRET_KEY');
  process.exit(1);
}

const stripe = new Stripe(key);

async function main() {
  try {
    const subs = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer', 'data.items.data.price.product']
    });

    console.log('=== SUSCRIPCIONES ACTIVAS EN STRIPE ===\n');
    console.log('Total:', subs.data.length, 'suscripciones activas\n');

    for (const sub of subs.data) {
      const customer = sub.customer;
      const item = sub.items.data[0];
      const price = item?.price;
      const product = price?.product;
      const amount = (price?.unit_amount || 0) / 100;
      const currency = price?.currency?.toUpperCase() || 'MXN';
      const interval = price?.recurring?.interval || 'month';

      console.log('----------------------------------------');
      console.log('Cliente:', customer?.name || customer?.email || customer?.id);
      console.log('Email:', customer?.email || 'N/A');
      console.log('Plan:', typeof product === 'object' ? product.name : 'Plan');
      console.log('Monto: $' + amount.toLocaleString(), currency + '/' + (interval === 'month' ? 'mes' : interval === 'year' ? 'año' : interval));
      console.log('Estado:', sub.status);
      console.log('Periodo:', new Date(sub.current_period_start * 1000).toLocaleDateString('es-MX'), '-', new Date(sub.current_period_end * 1000).toLocaleDateString('es-MX'));
    }

    if (subs.data.length === 0) {
      console.log('No hay suscripciones activas en Stripe.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
