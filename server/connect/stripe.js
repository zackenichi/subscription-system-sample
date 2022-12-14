const stripe = require('stripe');

const Stripe = stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

const createStripeCustomer = async (email, name) => {
  const customer = await Stripe.customers.create({
    email,
    name,
    description: 'New Customer',
  });

  return customer;
};

const getStripeCustomerByID = async (id) => {
  const customer = await Stripe.customers.retrieve(id);
  return customer;
};

const updateStripeCustomer = async (billingId, email, name) => {
  const userUpdate = await Stripe.customers.update(billingId, {
    email: email,
    name: name,
  });

  return userUpdate;
};

module.exports = {
  createStripeCustomer,
  getStripeCustomerByID,
  updateStripeCustomer,
};
