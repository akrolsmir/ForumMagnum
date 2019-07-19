import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import withUser from '../common/withUser';
import { unflattenComments } from '../../lib/modules/utils/unflatten';
import withRecordPostView from '../common/withRecordPostView';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  showChildren: {
    textAlign:"right",
    padding: 4,
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    display: "block",
    fontSize: 14,
  },
})

class ShortformThread extends PureComponent {
  state = { markedAsVisitedAt: null, maxChildren: 3 }

  markAsRead = async () => {
    const { comment, recordPostView } = this.props
    this.setState({markedAsVisitedAt: new Date()});
    recordPostView({...this.props, document: comment.post})
  }

  render () {
    const { classes, comment, refetch } = this.props
    const { CommentsNode } = Components
    const { markedAsVisitedAt, maxChildren } = this.state

    const lastCommentId = comment.latestChildren[0]?._id

    const renderedChildren = comment.latestChildren.slice(0, maxChildren)
    const extraChildrenCount = (comment.latestChildren.length > renderedChildren.length) && (comment.latestChildren.length - renderedChildren.length)

    const nestedComments = unflattenComments(renderedChildren)
    const lastVisitedAt = markedAsVisitedAt || comment.post.lastVisitedAt

    return <div>
        <CommentsNode
          startThreadTruncated={true}
          showPostTitle
          startCollapsed
          nestingLevel={1}
          lastCommentId={lastCommentId}
          comment={comment}
          markAsRead={this.markAsRead}
          highlightDate={lastVisitedAt}
          //eslint-disable-next-line react/no-children-prop
          children={nestedComments}
          key={comment._id}
          post={comment.post}
          condensed
          shortform
          refetch={refetch}
        />
        {(extraChildrenCount>0) && <a className={classes.showChildren} onClick={()=>this.setState({maxChildren: 500})}>{extraChildrenCount} additional comments</a>}
      </div>
  }
}

registerComponent('ShortformThread', ShortformThread, withUser, withRecordPostView, withStyles(styles, {name:"ShortformThread"}));
