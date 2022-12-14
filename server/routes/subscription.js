// import { Router } from 'express';
// import Stripe from 'stripe
const subscriptionRouter = require('express').Router();
const Stripe = require('stripe');

// const subscriptionRouter = Router();

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

subscriptionRouter.post('/create', async (req, res) => {
  try {
    const { billingId, planName, paymentMethod } = req.body;

    if (!billingId || !planName || !paymentMethod) {
      return res.status(400).send({ message: 'Incomplete payload' });
    }

    // test if received payload
    // console.log({ billingId, planName, paymentMethod });
    // res.status(200).json({
    //   message: `billingId: ${billingId}, planName: ${planName}, paymentMethod: ${paymentMethod}`,
    // });

    // test if reached
    // res.status(200).send({ message: 'test success' });
    // console.log('called create subscription ');

    // attach payment method to customer
    // paymentMethod is Id
    const paymentMethodUpdate = await stripe.paymentMethods.attach(
      paymentMethod,
      { customer: billingId }
    );

    if (!paymentMethodUpdate) {
      return res
        .status(500)
        .send({ message: 'Failed to update payment method' });
    }

    // update customer payment method

    const customer = await stripe.customers.update(billingId, {
      invoice_settings: { default_payment_method: paymentMethod },
    });

    if (!customer) {
      return res
        .status(500)
        .send({ message: 'Failed to update customer payment method' });
    }

    // test if reached update customer
    // res.status(200).send({ message: 'updating customer success' });

    // if (!customer) {
    //   return res
    //     .status(400)
    //     .send({ message: 'Unable to update Stripe customer' });
    // }

    // create subscription

    let price = '';

    if (planName === 'BASIC') {
      price = process.env.PRODUCT_BASIC;
    } else if (planName === 'PRO') {
      price = process.env.PRODUCT_PRO;
    }

    const subscription = await stripe.subscriptions.create({
      customer: billingId,
      items: [{ price: price }],
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });
    // console.log(subscription);

    if (!subscription) {
      return res.status(500).send({ message: 'Subscription failed' });
    }

    res.status(200).json({
      message: 'Subscription successful',
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      subscriptionId: subscription.id,
    });

    // res
    //   .status(200)
    //   .json({ message: `price = ${price}, billingId: ${billingId}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// subscriptionRouter.route('/create').post(createSubscription);

module.exports = subscriptionRouter;
