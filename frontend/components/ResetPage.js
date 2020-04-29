import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Mutation } from 'react-apollo';
import gql from 'graphql-tag';

import Form from './styles/Form';
import Error from './ErrorMessage';
import { CURRENT_USER_QUERY } from './User';

const RESET_PASSWORD_MUTATION = gql`
  mutation RESET_PASSWORD_MUTATION(
    $resetToken: String!
    $password: String!
    $confirmPassword: String!
  ) {
    resetPassword(
      resetToken: $resetToken
      password: $password
      confirmPassword: $confirmPassword
    ) {
      id
      name
      email
      permissions
    }
  }
`;

class RequestReset extends Component {
  state = {
    password: '',
    confirmPassword: ''
  };

  saveToState = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  render() {
    const { resetToken } = this.props;
    const { password, confirmPassword } = this.state;
    return (
      <Mutation
        mutation={RESET_PASSWORD_MUTATION}
        variables={{
          resetToken,
          password,
          confirmPassword
        }}
        refetchQueries={[{ query: CURRENT_USER_QUERY }]}
      >
        {(resetPassword, { error, loading }) => (
          <Form
            method="POST"
            onSubmit={async e => {
              e.preventDefault();
              await resetPassword();
              this.setState({ password: '', confirmPassword: '' });
            }}
          >
            <fieldset disabled={loading} aria-busy={loading}>
              <h2>Reset Password</h2>
              <Error error={error} />

              <label htmlFor="password">
                Password
                <input
                  type="password"
                  name="password"
                  placeholder="password"
                  value={password}
                  onChange={this.saveToState}
                />
              </label>
              <label htmlFor="confirm-password">
                Confirm Password
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="confirm password"
                  value={confirmPassword}
                  onChange={this.saveToState}
                />
              </label>
              <button type="submit">
                Reset{loading ? 'ing' : ''} Password
              </button>
            </fieldset>
          </Form>
        )}
      </Mutation>
    );
  }
}

RequestReset.propTypes = {
  resetToken: PropTypes.string.isRequired
};

export default RequestReset;
