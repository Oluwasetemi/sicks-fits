import PropTypes from 'prop-types';
import PleaseSignIn from '../components/PleaseSignIn';
import Order from '../components/Order';

const OrderPage = ({ query }) => (
  <div>
    <PleaseSignIn>
      <Order id={query.id} />
    </PleaseSignIn>
  </div>
);

OrderPage.propTypes = {
  query: PropTypes.shape({
    id: PropTypes.any
  })
};

export default OrderPage;
