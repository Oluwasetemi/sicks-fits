import React, { Component } from 'react';
import gql from 'graphql-tag';
import { Mutation } from 'react-apollo';
import Router from 'next/router';
import StripeCheckout from 'react-stripe-checkout';
import Nprogress from 'nprogress';
import PropTypes from 'prop-types';

import User, { CURRENT_USER_QUERY } from './User';
import Error from './ErrorMessage';
import calcTotalPrice from '../lib/calcTotalPrice';

function totalItem(cart) {
  return cart.reduce((tally, cartItem) => tally + cartItem.quantity, 0);
}

const CREATE_ORDER_MUTATION = gql`
  mutation CREATE_ORDER_MUTATION($token: String!) {
    createOrder(token: $token) {
      id
      total
      charge
      items {
        id
        title
      }
    }
  }
`;

export default class TakeMyMoney extends Component {
  onToken = async (res, createOrder) => {
    Nprogress.start();
    // manually call the createOrder once we have a token
    const order = await createOrder({
      variables: {
        token: res.id
      }
    }).catch(err => alert(err.message));

    console.log(order);
    Router.push({
      pathname: '/order',
      query: { id: order.data.createOrder.id }
    });
  };

  render() {
    const { children } = this.props;
    return (
      <User>
        {({ data: { me }, loading, error }) => {
          if (loading) return null;
          if (error) return <Error error={error} />;
          return (
            <Mutation
              mutation={CREATE_ORDER_MUTATION}
              refetchQueries={[{ query: CURRENT_USER_QUERY }]}
            >
              {createOrder => (
                <StripeCheckout
                  amount={calcTotalPrice(me.cart)}
                  name="Sick Fits"
                  description={`order of ${totalItem(me.cart)} items`}
                  image={me.cart.length ? me.cart[0].item.image : ''}
                  stripeKey="pk_test_fOoCev4lsprDn66Saofeh1rZ00YDOVhvbh"
                  currency="USD"
                  email={me.email}
                  token={res => this.onToken(res, createOrder)}
                >
                  {children}
                </StripeCheckout>
              )}
            </Mutation>
          );
        }}
      </User>
    );
  }
}

TakeMyMoney.propTypes = {
  children: PropTypes.node.isRequired
};

export { CREATE_ORDER_MUTATION };
