import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import { ALL_ITEMS_QUERY } from './Items';

const DELETE_ITEM_MUTATION = gql`
  mutation DELETE_ITEM_MUTATION($id: ID!) {
    deleteItem(id: $id) {
      id
    }
  }
`;

class DeleteItem extends Component {
  update = (cache, payload) => {
    // manually update the cache on the client, so it matches the server
    // 1. read the cache for the items we want
    const data = cache.readQuery({ query: ALL_ITEMS_QUERY });

    // 2. Filter the deleted item out of the page
    data.items = data.items.filter(
      item => item.id !== payload.data.deleteItem.id
    );
    // 3. put the items back!
    cache.writeQuery({ query: ALL_ITEMS_QUERY, data });
  };

  render() {
    const { id, children } = this.props;
    return (
      <Mutation
        mutation={DELETE_ITEM_MUTATION}
        variables={{ id }}
        update={this.update}
      >
        {(deleteItem, { error }) => (
          <button
            type="submit"
            onClick={() => {
              if (confirm('Are you sure want to delete this item?')) {
                deleteItem().catch(error => alert(error.message));
              }
            }}
          >
            {children}
          </button>
        )}
      </Mutation>
    );
  }
}

DeleteItem.propTypes = {
  children: PropTypes.any,
  id: PropTypes.any
};

export default DeleteItem;
