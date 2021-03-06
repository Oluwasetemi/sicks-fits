import { formatDistance } from 'date-fns';
import gql from 'graphql-tag';
import Link from 'next/link';
import React, { Component } from 'react';
import { Query } from 'react-apollo';
import styled from 'styled-components';
import formatMoney from '../lib/formatMoney';
import Error from './ErrorMessage';
import OrderItemStyles from './styles/OrderItemStyles';

const ALL_ORDER_QUERY = gql`
  query ALL_ORDER_QUERY {
    orders(orderBy: createdAt_DESC) {
      id
      total
      createdAt
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

const OrderUI = styled.ul`
  display: grid;
  grid-gap: 4rem;
  grid-template-columns: repeat(auto-fit, minimax(40%, 1fr));
`;

export default class Orders extends Component {
  render() {
    return (
      <Query query={ALL_ORDER_QUERY}>
        {({ data: { orders }, error, loading }) => {
          if (error) return <Error error={error} />;
          if (loading) return <p>loading ....</p>;
          return (
            <div>
              <h2>You have {orders.length} order{orders.length > 1 ? 's' : ''}</h2>
              <OrderUI>
                {orders.map(order => (
                  <OrderItemStyles key={order.id}>
                    <Link
                      href={{
                        pathname: '/order',
                        query: { id: order.id }
                      }}
                    >
                      <a>
                        <div className="order-meta">
                          <p>
                            {order.items.reduce((a, b) => a + b.quantity, 0)}{' '}
                            Items
                          </p>
                          <p>{order.items.length} Products</p>
                          <p>{formatDistance(order.createdAt, new Date())}</p>
                          <p>{formatMoney(order.total)}</p>
                        </div>
                        <div className="images">
                          {order.items.map(item => (
                            <img
                              key={item.id}
                              src={item.image}
                              alt={item.title}
                            />
                          ))}
                        </div>
                      </a>
                    </Link>
                  </OrderItemStyles>
                ))}
              </OrderUI>
            </div>
          );
        }}
      </Query>
    );
  }
}
