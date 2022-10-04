import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import React from 'react';
import { Link } from 'react-router-dom';
import { useSingle } from '../../lib/crud/withSingle';
import { useNewEvents } from '../../lib/events/withNewEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: theme.spacing.unit*2,
    position:"relative"
  },
  assistance: { //UNUSED
    color: theme.palette.text.normal,
  },
  'easy-going': {
    color: theme.palette.text.moderationGuidelinesEasygoing,
  },
  'norm-enforcing': {
    color: theme.palette.text.moderationGuidelinesNormEnforcing,
  },
  'reign-of-terror': {
    color: theme.palette.text.moderationGuidelinesReignOfTerror,
  },
  'editButton': {
    cursor: "pointer",
    position: 'absolute',
    right: 16,
    height: '0.8em'
  },
  collapse: {
    display:"flex",
    justifyContent:"flex-end",
    fontSize: 14,
    marginBottom: 4,
  },
  moderationGuidelines: {
    fontSize: "1.1rem",
    '& p, & ul': {
      marginTop: '.6em',
      marginBottom: '.6em'
    },
    '& li': {
      marginTop: '.4em',
      marginBottom: '.4em'
    }
  }
})

const newUserGuidelines = `
  <p><b>New User?  Read this before commenting.</b></p>
  <p>Welcome to LessWrong!</p>
  <p>We care a lot about making progress on art of human rationality and other important questions, and so have set very high standards for quality of writing on the site in comparison to many places on the web.</p>
  <p>To have well-received comments on LessWrong, we suggest spending some time learning from the example of content already on the site.</p>
  <p>We especially advise reading <a href="https://www.lesswrong.com/rationality">R:A-Z</a> and <a href="https://www.lesswrong.com/codex">The Codex</a>, since they help set the tone and standard for the site broadly.</p>
  <p>Otherwise look at highly upvoted posts and comments to see what to aim for when contributing here.</p>
`;

const NewUserGuidelinesDialog = ({classes, onClose, post, user}: {
  classes: ClassesType,
  onClose: () => void,
  post: PostsMinimumInfo,
  user: UsersCurrent
}) => {
  const { LWDialog } = Components;
  const updateCurrentUser = useUpdateCurrentUser();
  const {recordEvent} = useNewEvents();

  const { document: postWithDetails, loading } = useSingle({
    skip: !post,
    documentId: post?._id,
    collectionName: "Posts",
    fetchPolicy: "cache-first",
    fragmentName: "PostsList",
  });
  
  if (!post || !postWithDetails)
    return null
  if (loading)
    return <Components.Loading/>

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const eventProperties = {
      userId: user._id,
      important: false,
      intercom: true,
      documentId: postWithDetails?.userId,
    };
    void updateCurrentUser({
      acknowledgedNewUserGuidelines: true
    });
    recordEvent('acknowledged-new-user-guidelines', false, eventProperties);
    onClose();
  }
  
  return (
    <Components.ContentStyles contentType="comment" className={classes.moderationGuidelines}>
      <LWDialog open={true}>
        <DialogTitle>
          New User?  Read this before commenting.
        </DialogTitle>
        <DialogContent>
        <p>Welcome to LessWrong!</p>
          <br />
          <p>We care a lot about making progress on art of human rationality and other important questions, and so have set very high standards for quality of writing on the site in comparison to many places on the web.</p>
          <br />
          <p>To have well-received comments on LessWrong, we suggest spending some time learning from the example of content already on the site.</p>
          <br />
          <p>We especially advise reading <Link to="/rationality">R:A-Z</Link> and <Link to="/codex">The Codex</Link>, since they help set the tone and standard for the site broadly.</p>
          <br />
          <p>Otherwise look at highly upvoted posts and comments to see what to aim for when contributing here.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClick}>
            Acknowledged
          </Button>
        </DialogActions>
      </LWDialog>
      <div dangerouslySetInnerHTML={{__html: newUserGuidelines}}/>
    </Components.ContentStyles>
  )
}

const NewUserGuidelinesDialogComponent = registerComponent('NewUserGuidelinesDialog', NewUserGuidelinesDialog, { styles });

declare global {
  interface ComponentTypes {
    NewUserGuidelinesDialog: typeof NewUserGuidelinesDialogComponent
  }
}
