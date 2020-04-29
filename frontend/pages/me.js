import React, { Component } from 'react';
import styled from 'styled-components';
import md5 from 'md5';
import User from '../components/User';

const UserStyle = styled.div`
  border: 2px solid ${props => props.theme.black};
  display: grid;
  grid-template-columns: auto 1fr;
  padding: 2rem;
  img {
    width: 300px;
    height: 300px;
  }
  .user-info {
    margin: 2rem;
  }
`;

function generateGravatar(email) {
  const hash = md5(email);
  return `https://gravatar.com/avatar/${hash}s=300`;
}

export default class mePage extends Component {
  render() {
    return (
      <div>
        <p>Owner's Page</p>
        <User>
          {({ data: { me } }) => (
            <UserStyle>
              <img src={generateGravatar(me.email)} alt={me.name} />
              <div className="user-info">
                <p>Name: {me.name}</p>
                <p>Email: {me.email}</p>
                <p>Permissions: {me.permissions.join(' * ')}</p>
                <p>
                  cart: {me.cart.length} item{me.cart.length === 1 ? '' : 's'}{' '}
                </p>
                {/* <pre>{JSON.stringify(me, null, 2)}</pre> */}
              </div>
            </UserStyle>
          )}
        </User>
      </div>
    );
  }
}
