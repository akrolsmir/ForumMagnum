import React from 'react';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import { withRouter } from '../../lib/reactRouterWrapper.js';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useNavigation } from '../../lib/routeUtil';


const NewShortformDialog = ({onClose}) => {
  const { ShortformSubmitForm } = Components;
  const { history } = useNavigation();
  return (
    <Dialog open={true}
      onClose={onClose}
      fullWidth maxWidth="sm"
    >
      <DialogContent>
        <ShortformSubmitForm
          successCallback={() => {
            onClose();
            router.push('/shortform');
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

registerComponent('NewShortformDialog', NewShortformDialog);