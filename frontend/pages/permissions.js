import Permissions from '../components/Permissions';
import PleaseSignIn from '../components/PleaseSignIn';

const Permission = props => (
  <div>
    <PleaseSignIn>
      <Permissions />
    </PleaseSignIn>
  </div>
);

export default Permission;
