import ApolloClient from 'apollo-boost';
import withApollo from 'next-with-apollo';
import { LOCAL_STATE_QUERY } from '../components/Cart';
import { endpoint, prodEndpoint } from '../config';

function createClient({ headers }) {
	return new ApolloClient({
		uri: process.env.NODE_ENV === 'development' ? endpoint : prodEndpoint,
		request: operation => {
			operation.setContext({
				fetchOptions: {
					credentials: 'include',
				},
				headers,
			});
		},
		// local data
		clientState: {
			resolvers: {
				Mutation: {
					toggleCart(_, variables, { cache }) {
						// read the cartOpen value from the cache
						const { cartOpen } = cache.readQuery({ query: LOCAL_STATE_QUERY });
						// write the cache state to the opposite
						const data = {
							data: { cartOpen: !cartOpen },
						};
						cache.writeData(data);
						return data;
					},
				},
			},
			defaults: {
				cartOpen: false,
			},
		},
	});
}

export default withApollo(createClient);
