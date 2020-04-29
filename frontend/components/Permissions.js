import React from 'react';
import PropTypes from 'prop-types';

import { Query, Mutation } from 'react-apollo';
import gql from 'graphql-tag';
import Error from './ErrorMessage';
import Table from './styles/Table';
import SickButton from './styles/SickButton';

const possiblePermissions = [
  'ADMIN',
  'USER',
  'ITEMCREATE',
  'ITEMUPDATE',
  'ITEMDELETE',
  'PERMISSIONUPDATE'
];

const UPDATE_PERMISSION_QUERY = gql`
  mutation UPDATE_PERMISSION_QUERY($permissions: [Permission], $userId: ID!) {
    updatePermissions(permissions: $permissions, userId: $userId) {
      id
      permissions
      name
      email
    }
  }
`;

const ALL_USERS_QUERY = gql`
  query ALL_USERS_QUERY {
    users {
      name
      id
      email
      permissions
    }
  }
`;

const Permissions = props => (
  <Query query={ALL_USERS_QUERY}>
    {({ data, loading, error }) => (
      <div>
        <Error error={error} />
        <div>
          <h2>Manage Permissions</h2>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                {possiblePermissions.map(eachPermissions => (
                  <th key={eachPermissions}>{eachPermissions}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.users.map(user => (
                <UserPermissions user={user} key={user.id} />
              ))}
            </tbody>
          </Table>
        </div>
      </div>
    )}
  </Query>
);

class UserPermissions extends React.Component {
  state = {
    permissions: this.props.user.permissions
  };

  handlePermissionChange = (e, updatePermissions) => {
    const checkbox = e.target;

    const { permissions } = this.state;

    let updatedPermissions = [...permissions];

    if (checkbox.checked) {
      updatedPermissions.push(checkbox.value);
    } else {
      updatedPermissions = updatedPermissions.filter(
        permission => permission !== checkbox.value
      );
    }
    this.setState({ permissions: updatedPermissions }, updatePermissions);
  };

  render() {
    const { user } = this.props;
    const { permissions } = this.state;
    return (
      <Mutation
        mutation={UPDATE_PERMISSION_QUERY}
        variables={{
          permissions,
          userId: this.props.user.id
        }}
      >
        {(updatePermissions, { loading, error }) => (
          <>
            {error && (
              <tr>
                <td colSpan="8">
                  <Error error={error} />
                </td>
              </tr>
            )}
            <tr>
              <td> {user.name} </td>
              <td> {user.email} </td>
              {possiblePermissions.map(eachPermission => (
                <td key={eachPermission}>
                  <label htmlFor={`${user.id}-permissions-${eachPermission}`}>
                    <input
                      id={`${user.id}-permissions-${eachPermission}`}
                      type="checkbox"
                      checked={permissions.includes(eachPermission)}
                      value={eachPermission}
                      onChange={e =>
                        this.handlePermissionChange(e, updatePermissions)
                      }
                    />
                  </label>
                </td>
              ))}
              <td>
                <SickButton
                  type="button"
                  disabled={loading}
                  onClick={updatePermissions}
                >
                  UPDAT{loading ? 'ING' : 'E'}
                </SickButton>
              </td>
            </tr>
          </>
        )}
      </Mutation>
    );
  }
}

UserPermissions.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    id: PropTypes.string,
    permissions: PropTypes.array
  }).isRequired
};

export default Permissions;
