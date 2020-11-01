/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/state-in-constructor */
import Downshift, { resetIdCounter } from 'downshift';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import Router from 'next/router';
import React, { Component } from 'react';
import { ApolloConsumer } from 'react-apollo';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';

const SEARCH_ITEM_QUERY = gql`
  query SEARCH_ITEM_QUERY($searchTerm: String!) {
    items(
      where: {
        OR: [
          { title_contains: $searchTerm }
          { description_contains: $searchTerm }
        ]
      }
    ) {
      id
      title
      # description
      image
    }
  }
`;

function routeToItem(item) {
  Router.push({
    pathname: '/item',
    query: {
      id: item.id
    }
  });
}

class AutoComplete extends Component {
  state = {
    loading: false,
    items: []
  };

  handleOnChange = debounce(async (e, client) => {
    this.setState({ loading: true });
    const res = await client.query({
      query: SEARCH_ITEM_QUERY,
      variables: { searchTerm: e.target.value }
    });
    this.setState({ items: res.data.items, loading: false });
  }, 400);

  render() {
    const { loading, items } = this.state;
    resetIdCounter();
    return (
      <SearchStyles>
        <Downshift
          onChange={routeToItem}
          itemToString={item => (item === null ? '' : item.title)}
        >
          {({
            getInputProps,
            getItemProps,
            isOpen,
            highlightedIndex,
            inputValue
          }) => (
            <div>
              <ApolloConsumer>
                {client => (
                  <input
                    type="search"
                    {...getInputProps({
                      type: 'search',
                      placeholder: 'Search for an Items',
                      id: 'search',
                      className: loading ? 'loading' : '',
                      onChange: e => {
                        e.persist();
                        this.handleOnChange(e, client);
                      }
                    })}
                  />
                )}
              </ApolloConsumer>
              {isOpen && (
                <DropDown>
                  {items.map((item, index) => (
                    <DropDownItem
                      key={item.id}
                      {...getItemProps({ item })}
                      highlighted={index === highlightedIndex}
                    >
                      <img width={50} src={item.image} alt={item.title} />
                      {item.title}
                    </DropDownItem>
                  ))}
                  {!items.length && !loading && (
                    <DropDownItem>
                      Nothing was found for {inputValue}
                    </DropDownItem>
                  )}
                </DropDown>
              )}
            </div>
          )}
        </Downshift>
      </SearchStyles>
    );
  }
}

export default AutoComplete;
