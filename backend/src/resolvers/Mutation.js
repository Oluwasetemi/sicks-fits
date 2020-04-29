const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const { hasPermission } = require('../utils');

const { send } = require('../mail/mail');
const stripe = require('../stripe');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    if (!ctx.request.userId) {
      throw new Error(`You must be logged in to do that`);
    }

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          user: {
            connect: {
              id: ctx.request.userId
            }
          },
          ...args
        }
      },
      info
    );
    return item;
  },
  updateItem(parent, args, ctx, info) {
    // create a copy
    const updates = { ...args };
    // delete the id
    delete updates.id;
    // perform update
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find the item
    const item = await ctx.db.query.item(
      { where },
      `{ id, title user { id } }`
    );
    // 2. Check if they own that item, or have the permissions
    const ownsItems = item.user.id === ctx.request.userId;
    const hasPermissions = ctx.request.user.permissions.some(permission =>
      ['ADMIN', 'ITEMDELETE'].includes(permission)
    );
    if (!ownsItems && !hasPermissions) {
      throw new Error('You do not have the right permissions');
    }
    // Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    args.email = args.email.toLowerCase();
    const password = await bcrypt.hash(args.password, 10);
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ['USER'] }
        }
      },
      info
    );
    // create JWT
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // we set the jwt as a cookie on the response
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    // 1. check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });

    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }

    // 2. check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error('Invalid Password');
    }

    // 3. generate the JWT Token
    const token = await jwt.sign({ userId: user.id }, process.env.APP_SECRET);

    // ctx.response.header.authorization = token;
    // 4. Set the cookie with the token
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie('token');
    return { message: 'Goodbye' };
  },
  async requestReset(parent, { email }, ctx, info) {
    // 1. check if this is a real user
    const user = await ctx.db.query.user({ where: { email } });

    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // 2. set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hr from now
    const res = await ctx.db.mutation.updateUser({
      where: { email },
      data: { resetToken, resetTokenExpiry }
    });
    //   using nodemailer to test with mailtrap

    // 3. Email them that reset token
    // const mailRes = await transport.sendMail({
    //   from: 'temi@oluwasetemi.dev',
    //   to: [user.email],
    //   subject: 'Your Password Reset Token',
    //   html: makeANiceEmail(`
    //         Your password Reset Token is here! \n\n
    //         <a href="${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}">Click here to Reset</a>.
    //         \n
    //         NB - Copy below otherwise ${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}
    //       `)
    // });

    await send({
      filename: 'request-reset',
      to: user.email,
      subject: 'Your Password Reset Token',
      name: user.name,
      resetLink: `${process.env.FRONTEND_URL}/reset?resetToken=${resetToken}`
    });

    return { message: 'Thanks. Reset successful' };
  },
  async resetPassword(
    parent,
    { resetToken, password, confirmPassword },
    ctx,
    info
  ) {
    // 1.check if the passwords match
    if (password !== confirmPassword) {
      throw new Error('password does not match');
    }

    // 2. check if its a legit reset Token
    // 3. check if its expired
    const [user] = await ctx.db.query.users({
      where: {
        resetToken,
        resetTokenExpiry_gte: Date.now() - 3600000
      }
    });

    if (!user) {
      throw new Error('This token is either invalid or expired');
    }

    // 4. Hash their new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Save the new password to the user and remove old resetToken fields
    const updatedUser = await ctx.db.mutation.updateUser({
      where: { email: user.email },
      data: {
        resetToken: null,
        resetTokenExpiry: null,
        password: hashedPassword
      }
    });
    // 6. Generate JWT
    const token = await jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // 7. Set the JWT cookie
    ctx.response.cookie('token', token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    // 8. return the new user
    return updatedUser;
  },
  async updatePermissions(parent, args, ctx, info) {
    //   1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }
    // 2. Query the current user
    const currentUSer = await ctx.db.query.user(
      {
        where: {
          id: ctx.request.userId
        }
      },
      info
    );
    //   3. CHeck if they have permissions to do this
    hasPermission(currentUSer, ['ADMIN', 'PERMISSIONUPDATE']);
    //   4. update the permissions
    return ctx.db.mutation.updateUser(
      {
        data: {
          permissions: {
            set: args.permissions
          }
        },
        where: {
          id: args.userId
        }
      },
      info
    );
  },
  async addToCart(parent, args, ctx, info) {
    //   1. Check if they are logged in
    if (!ctx.request.userId) {
      throw new Error('You must be logged in!');
    }
    const { userId } = ctx.request;
    // 2.Query the users current cart
    const [existingCartItem] = await ctx.db.query.cartItems({
      where: {
        user: { id: userId },
        item: { id: args.id }
      }
    });
    // 3 check if item is currently in there cart, if there increment by 1
    if (existingCartItem) {
      return ctx.db.mutation.updateCartItem({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + 1 }
      });
    }
    // 4. if it is not there, create a fresh cartItem for that  user
    return ctx.db.mutation.createCartItem({
      data: {
        user: {
          connect: { id: userId }
        },
        item: {
          connect: { id: args.id }
        }
      }
    });
  },
  async removeFromCart(parent, args, ctx, info) {
    // 1. find the cartItem via id
    const cartItem = await ctx.db.query.cartItem(
      {
        where: {
          id: args.id
        }
      },
      `{ id, user { id } }`
    );
    // 2. Make sure a cart Item is found or return error
    if (!cartItem) throw new Error('Cart item not found');
    // 3. Make sure the current user owns the cart items
    if (cartItem.user.id !== ctx.request.userId)
      throw new Error('cheating uhn?');
    // Delete cart item
    return ctx.db.mutation.deleteCartItem(
      {
        where: { id: args.id }
      },
      info
    );
  },
  async createOrder(parent, args, ctx, info) {
    // 1. Query the current user and make sure they are signed in
    const { userId } = ctx.request;
    if (!userId)
      throw new Error('You must be signed in to complete this order.');
    const user = await ctx.db.query.user(
      { where: { id: userId } },
      `{
      id
      name
      email
      cart {
        id
        quantity
        item { title price id description image largeImage }
      }}`
    );
    // 2. recalculate the total for the price
    const amount = user.cart.reduce(
      (tally, cartItem) => tally + cartItem.item.price * cartItem.quantity,
      0
    );
    // 3. Create the stripe charge (turn token into $$$)
    const charge = await stripe.charges.create({
      amount,
      currency: 'USD',
      source: args.token
    });
    // 4. Convert the CartItems to OrderItems
    const orderItems = user.cart.map(cartItem => {
      const orderItem = {
        ...cartItem.item,
        quantity: cartItem.quantity,
        user: { connect: { id: userId } }
      };
      delete orderItem.id;
      return orderItem;
    });

    // 5. create the Order
    const order = await ctx.db.mutation.createOrder({
      data: {
        total: charge.amount,
        charge: charge.id,
        items: { create: orderItems },
        user: { connect: { id: userId } }
      }
    });
    // 6. Clean up - clear the users cart, delete cartItems
    const cartItemIds = user.cart.map(cartItem => cartItem.id);
    await ctx.db.mutation.deleteManyCartItems({
      where: {
        id_in: cartItemIds
      }
    });
    // 7. Return the Order to the client
    return order;
  }
};

module.exports = Mutations;
