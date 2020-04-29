const stripe = require('stripe');

module.exports = require('stripe')(process.env.STRIPE_SECRET);
