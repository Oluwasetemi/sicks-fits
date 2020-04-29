import PropTypes from 'prop-types';
import React, { Component } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import { format } from 'date-fns';
import Head from 'next/head';
import Error from './ErrorMessage';
import OrderStyles from './styles/OrderStyles';
import formatMoney from '../lib/formatMoney';

const SINGLE_ORDER_QUERY = gql`
  query SINGLE_ORDER_QUERY($id: ID!) {
    order(id: $id) {
      id
      charge
      total
      createdAt
      user {
        id
      }
      items {
        id
        title
        description
        price
        image
        quantity
      }
    }
  }
`;

export default class Order extends Component {
  render() {
    const { id } = this.props;
    return (
      <Query query={SINGLE_ORDER_QUERY} variables={{ id }}>
        {({ data, error, loading }) => {
          if (error) return <Error error={error} />;
          if (loading) return <p>loading ....</p>;
          const { order } = data;
          return (
            <OrderStyles data-test="order">
              <Head>
                <title>Sick Fits - Order {order.id}</title>
              </Head>
              <p>
                <span>Order ID:</span>
                <span>{id}</span>
              </p>
              <p>
                <span>Charge</span>
                <span>{order.charge}</span>
              </p>
              <p>
                <span>Date</span>
                <span>
                  {format(order.createdAt, 'MMMM d, YYYY h:mm a', {
                    awareOfUnicodeTokens: true
                  })}
                </span>
              </p>
              <p>
                <span>Order Total</span>
                <span>{formatMoney(order.total)}</span>
              </p>
              <p>
                <span>Item Count</span>
                <span>{order.items.length}</span>
              </p>
              <div className="items">
                {order.items.map(item => (
                  <div className="order-item" key={item.id}>
                    <img src={item.image} alt={item.title} />
                    <div className="item-details">
                      <h2>{item.title}</h2>
                      <p>Qty: {item.quantity}</p>
                      <p>Each: {formatMoney(item.price)}</p>
                      <p>SubTotal: {formatMoney(item.price * item.quantity)}</p>
                      <p>{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </OrderStyles>
          );
        }}
      </Query>
    );
  }
}

Order.propTypes = {
  id: PropTypes.any
};

export { SINGLE_ORDER_QUERY };
