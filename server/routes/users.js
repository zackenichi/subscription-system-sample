const router = require('express').Router();
const { User, validate } = require('../models/user');
const bcrypt = require('bcrypt');
const Stripe = require('../connect/stripe');

router.post('/', async (req, res) => {
  try {
    const { error } = validate(req.body);

    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }

    const user = await User.findOne({ email: req.body.email });

    if (user) {
      return res.status(409).send({ message: 'Email already exists' });
    }

    const fullName = req.body.firstName + ' ' + req.body.lastName;
    const customerInfo = await Stripe.createStripeCustomer(
      req.body.email,
      fullName
    );

    const salt = await bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = await bcrypt.hash(req.body.password, salt);

    const created = await new User({
      ...req.body,
      password: hashPassword,
      billingId: customerInfo.id,
    }).save();

    console.log(created);

    res.status(201).send({ message: 'User created successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(400).send({ message: 'User not found' });
    }

    res.status(200).send({ message: 'User found', data: user });
  } catch (error) {
    res.status(400).send({ message: 'Internal server error' });
  }
});

// update
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(400).send({ message: 'User not found' });
    }

    const update = await User.findByIdAndUpdate(userId, req.body).exec();

    if (!update) {
      return res.status(400).send({ message: 'Update failed' });
    }

    res.status(200).send({ message: 'User updated', data: update });
  } catch (error) {
    res.status(400).send({ message: 'Internal server error' });
  }
});

// get stripe info
router.get('/stripe/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // console.log('userId', userId);

    const user = await User.findById(userId).exec();

    // console.log('user', user);

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    const stripeCustomer = await Stripe.getStripeCustomerByID(user.billingId);

    // console.log(stripeCustomer);

    if (!stripeCustomer) {
      return res.status(404).send({ message: 'Stripe customer not found' });
    }

    res.status(200).send({ message: 'User found', data: stripeCustomer });
  } catch (error) {
    res.status(400).send({ message: 'Internal server error' });
  }
});

// update stripe customer
router.put('/stripe/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { email, name } = req.body;

    const user = await User.findById(userId).exec();

    if (!user) {
      return res.status(404).send({ message: 'User not found' });
    }

    if (!email || !name) {
      return res.status(400).send({ message: 'Name and email required' });
    }

    const stripeCustomer = await Stripe.updateStripeCustomer(
      user.billingId,
      email,
      name
    );

    if (!stripeCustomer) {
      return res.status(404).send({ message: 'Stripe customer update failed' });
    }

    res
      .status(200)
      .send({ message: 'Stripe user updated', data: stripeCustomer });
  } catch (error) {
    res.status(400).send({ message: 'Internal server error' });
  }
});

module.exports = router;
