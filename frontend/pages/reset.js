import PropTypes from 'prop-types';
import ResetPage from '../components/ResetPage';

const Reset = ({ query }) => (
  <div>
    <ResetPage resetToken={query.resetToken} />
  </div>
);

Reset.propTypes = {
  query: PropTypes.any
};

export default Reset;
