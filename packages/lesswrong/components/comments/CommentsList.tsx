import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { Link } from '../../lib/reactRouterWrapper';
import { TRUNCATION_KARMA_THRESHOLD } from '../../lib/editor/ellipsize'
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import type { CommentTreeNode } from '../../lib/utils/unflatten';
import type { CommentTreeOptions } from './commentTree';
import classNames from 'classnames';

const styles = (theme: ThemeType): JssStyles => ({
  button: {
    color: theme.palette.lwTertiary.main
  },
  nestedScroll: {
    overflowY: 'scroll',
  }
})

export const POST_COMMENT_COUNT_TRUNCATE_THRESHOLD = 70

const CommentsListFn = ({
  treeOptions,
  comments,
  totalComments = 0,
  startThreadTruncated,
  parentAnswerId,
  defaultNestingLevel = 1,
  parentCommentId,
  forceSingleLine,
  forceNotSingleLine,
  reversed = true,
  nestedScroll = true,
  topAbsolutePosition = 0,
  classes,
}: {
  treeOptions: CommentTreeOptions;
  comments: Array<CommentTreeNode<CommentsList>>;
  totalComments?: number;
  startThreadTruncated?: boolean;
  parentAnswerId?: string;
  defaultNestingLevel?: number;
  parentCommentId?: string;
  forceSingleLine?: boolean;
  forceNotSingleLine?: boolean;
  reversed?: boolean;
  nestedScroll?: boolean;
  topAbsolutePosition?: number;
  classes: ClassesType;
}) => {
  const currentUser = useCurrentUser();
  const [expandAllThreads, setExpandAllThreads] = useState(false);

  const bodyRef = useRef<HTMLDivElement|null>(null);
  const [userHasScrolled, setUserHasScrolled] = useState(false);

  useGlobalKeydown((event) => {
    const F_Key = 70;
    if ((event.metaKey || event.ctrlKey) && event.keyCode == F_Key) {
      setExpandAllThreads(true);
    }
  });

  const currentHeight = bodyRef.current?.clientHeight;
  useEffect(() => {
    if (!userHasScrolled && bodyRef.current) {
      bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);
    }

  }, [currentHeight, userHasScrolled])

  const { CommentsNode, SettingsButton, CommentsListMeta, LoginPopupButton, LWTooltip } = Components;

  const handleScroll = (e) => {
    const isAtBottom = Math.abs((e.target.scrollHeight - e.target.scrollTop) - e.target.clientHeight) < 10;

    // If we are not at the bottom that means the user has scrolled up,
    // in which case never autoscroll to the bottom again
    if (!isAtBottom)
      setUserHasScrolled(true);
  }

  const renderExpandOptions = () => {
    if (totalComments > POST_COMMENT_COUNT_TRUNCATE_THRESHOLD) {
      const expandTooltip = `Posts with more than ${POST_COMMENT_COUNT_TRUNCATE_THRESHOLD} comments automatically truncate replies with less than ${TRUNCATION_KARMA_THRESHOLD} karma. Click or press ⌘F to expand all.`;

      return (
        <CommentsListMeta>
          <span>
            Some comments are truncated due to high volume.{" "}
            <LWTooltip title={expandTooltip}>
              <a className={!expandAllThreads && classes.button} onClick={() => setExpandAllThreads(true)}>
                (⌘F to expand all)
              </a>
            </LWTooltip>
          </span>
          {currentUser ? (
            <LWTooltip title="Go to your settings page to update your Comment Truncation Options">
              <Link to="/account">
                <SettingsButton label="Change default truncation settings" />
              </Link>
            </LWTooltip>
          ) : (
            <LoginPopupButton title={"Login to change default truncation settings"}>
              <SettingsButton label="Change truncation settings" />
            </LoginPopupButton>
          )}
        </CommentsListMeta>
      );
    }
  };

  const commentsToRender = useMemo(() => reversed ? comments.reverse(): comments, [comments, reversed]);

  if (!comments) {
    return (
      <div>
        <p>No comments to display.</p>
      </div>
    );
  }

  const expandOptions = renderExpandOptions();
  return (
    <Components.ErrorBoundary>
      {!reversed && expandOptions}
      <div className={classNames({[classes.nestedScroll]: nestedScroll})} ref={bodyRef} onScroll={handleScroll}>
        {commentsToRender.map((comment) => (
          <CommentsNode
            treeOptions={treeOptions}
            startThreadTruncated={startThreadTruncated || totalComments >= POST_COMMENT_COUNT_TRUNCATE_THRESHOLD}
            expandAllThreads={expandAllThreads}
            comment={comment.item}
            childComments={comment.children}
            key={comment.item._id}
            parentCommentId={parentCommentId}
            parentAnswerId={parentAnswerId}
            forceSingleLine={forceSingleLine}
            forceNotSingleLine={forceNotSingleLine}
            shortform={(treeOptions.post as PostsBase)?.shortform}
            isChild={defaultNestingLevel > 1}
          />
        ))}
      </div>
    </Components.ErrorBoundary>
  );
};


const CommentsListComponent = registerComponent('CommentsList', CommentsListFn, {
  styles, hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    CommentsList: typeof CommentsListComponent,
  }
}

