import React from 'react';
import { Mutation } from 'react-apollo';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import gql from 'graphql-tag';
import { CURRENT_USER_QUERY } from './User';

const REMOVE_FROM_CART_MUTATION = gql`
  mutation REMOVE_FROM_CART_MUTATION($id: ID!) {
    removeFromCart(id: $id) {
      id
    }
  }
`;

const BigButton = styled.button`
  font-style: 3rem;
  border: 0;
  background: none;
  &:hover {
    color: ${props => props.theme.red};
    cursor: pointer;
  }
`;

class RemoveFromCart extends React.Component {
  // a fxn to be called after the server has returned a response
  update = (cache, payload) => {
    // read the cache
    const data = cache.readQuery({ query: CURRENT_USER_QUERY });
    // remove the item from the cart
    const cartItemId = payload.data.removeFromCart.id;
    data.me.cart = data.me.cart.filter(cartItem => cartItem.id !== cartItemId);
    // write it back to the cache
    cache.writeQuery({ query: CURRENT_USER_QUERY, data });
  };

  render() {
    const { id } = this.props;

    return (
      <Mutation
        mutation={REMOVE_FROM_CART_MUTATION}
        variables={{ id }}
        update={this.update}
        optimisticResponse={{
          __typename: 'Mutation',
          removeFromCart: {
            __typename: 'CartItem',
            id
          }
        }}
      >
        {(removeFromCart, { loading, error }) => (
          <BigButton
            disabled={loading}
            title="Delete Item"
            type="button"
            onClick={() => {
              removeFromCart().catch(err => alert(err.message));
            }}
          >
            &times;
          </BigButton>
        )}
      </Mutation>
    );
  }
}

RemoveFromCart.propTypes = {
  id: PropTypes.string.isRequired
};

export default RemoveFromCart;
