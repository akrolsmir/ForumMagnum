import React, { useRef, useState } from 'react'
import { registerComponent, Components } from '../../../lib/vulcan-lib';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useCurrentUser } from '../../common/withUser';
import { useTracking } from '../../../lib/analyticsEvents';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    cursor: "pointer"
  },
  icon: {
    verticalAlign: 'middle',
    cursor: "pointer",
  },
  popper: {
    position: "relative",
    zIndex: theme.zIndexes.postItemMenu
  },
})

const PostsPageActions = ({post, vertical, classes}: {
  post: PostsList,
  vertical?: boolean,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const {captureEvent} = useTracking();
  const currentUser = useCurrentUser();

  const handleSetOpen = (open: boolean) => {
    captureEvent("tripleDotClick", {open, itemType: "post", postId: post._id})
    setIsOpen(open);
  }

  const Icon = vertical ? MoreVertIcon : MoreHorizIcon
  const { PopperCard, PostActions, LWClickAwayListener } = Components
  if (!currentUser) return null;

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <Icon className={classes.icon} onClick={() => handleSetOpen(!isOpen)}/>
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="right-start"
      allowOverflow
    >
      <LWClickAwayListener onClickAway={() => handleSetOpen(false)}>
        <PostActions post={post} closeMenu={() => handleSetOpen(false)}/>
      </LWClickAwayListener>
    </PopperCard>
  </div>
}


const PostsPageActionsComponent = registerComponent('PostsPageActions', PostsPageActions, {styles});

declare global {
  interface ComponentTypes {
    PostsPageActions: typeof PostsPageActionsComponent
  }
}
