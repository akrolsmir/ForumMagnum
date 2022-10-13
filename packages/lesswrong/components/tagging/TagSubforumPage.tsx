import React, { useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useLocation } from "../../lib/routeUtil";
import { useTagBySlug } from "./useTag";
import { isMissingDocumentError } from "../../lib/utils/errorUtil";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import classNames from "classnames";
import { subforumDefaultSorting } from "../../lib/collections/comments/views";
import startCase from "lodash/startCase";
import truncateTagDescription from "../../lib/utils/truncateTagDescription";
import { Link } from "../../lib/reactRouterWrapper";
import { tagGetUrl } from "../../lib/collections/tags/helpers";
import { taggingNameSetting, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import Button from "@material-ui/core/Button";
import { useCurrentUser } from "../common/withUser";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    margin: "0 32px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    columnGap: 32,
    [theme.breakpoints.down("md")]: {
      margin: 0,
      flexDirection: "column",
    },
  },
  columnSection: {
    maxWidth: '100%',
    [theme.breakpoints.up("lg")]: {
      margin: 0,
    },
    [theme.breakpoints.down("md")]: {
      marginBottom: 0,
    },
  },
  stickToBottom: {
    marginTop: "auto",
    marginBottom: 3,
  },
  aside: {
    width: 380,
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  welcomeBox: {
    padding: 16,
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    border: theme.palette.border.commentBorder,
    borderColor: theme.palette.secondary.main,
    borderWidth: 2,
    borderRadius: 3,
  },
  title: {
    textTransform: "capitalize",
    marginLeft: 24,
    marginBottom: 10,
  },
  wikiSidebar: {
    marginTop: 84,
    gridColumnStart: 3,
    padding: '2em',
    backgroundColor: theme.palette.panelBackground.default,
    border: theme.palette.border.commentBorder,
    '& a': {
      color: theme.palette.primary,
    },
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  }
});

export const TagSubforumPage = ({ classes, user }: { classes: ClassesType; user: UsersProfile }) => {
  const {
    Error404,
    Loading,
    SubforumCentralFeed,
    SectionTitle,
    SingleColumnSection,
    Typography,
    ContentStyles,
    ContentItemBody,
    LWTooltip,
    HeadTags,
  } = Components;

  const { params, query } = useLocation();
  const currentUser = useCurrentUser()
  const { slug } = params;
  const sortBy = query.sortBy || subforumDefaultSorting;

  const { tag, loading, error } = useTagBySlug(slug, "TagSubforumFragment");

  if (loading) {
    return <Loading />;
  }

  if (!tag || !tag.isSubforum) {
    return <Error404 />;
  }

  if (error && !isMissingDocumentError(error)) {
    return (
      <SingleColumnSection>
        <Typography variant="body1">{error.message}</Typography>
      </SingleColumnSection>
    );
  }

  const welcomeBoxComponent = tag.subforumWelcomeText?.html ? (
    <div className={classes.welcomeBox}>
      <ContentStyles contentType="comment">
        <ContentItemBody
          dangerouslySetInnerHTML={{ __html: tag.subforumWelcomeText?.html || "" }}
          description={`${tag.name} subforum`}
        />
      </ContentStyles>
    </div>
  ) : <></>;

  const isSubscribed = currentUser && currentUser.profileTagIds?.includes(tag._id)
  const titleComponent = <>
    <LWTooltip title={`To ${taggingNameSetting.get()} page`} placement="top-start" className={classes.tooltip}>
      <Link to={tagGetUrl(tag)}>
        {startCase(tag.name)}
      </Link>
    </LWTooltip>
    {" "}Subforum
    {isSubscribed && <Button href={`/newPost?subforumTagId=${tag._id}`}>Add Post</Button>}
  </>

  return (
    <div className={classes.root}>
      <HeadTags
        description={`A space for casual discussion of ${tag.name.toLowerCase()} on ${siteNameWithArticleSetting.get()}`}
        title={`${startCase(tag.name)} Subforum`}
      />
      <div className={classNames(classes.columnSection, classes.stickToBottom, classes.aside)}>
        {welcomeBoxComponent}
      </div>
      <SingleColumnSection className={classNames(classes.columnSection, classes.fullWidth)}>
        <SectionTitle title={titleComponent} className={classes.title} />
        <AnalyticsContext pageSectionContext="commentsSection">
          <SubforumCentralFeed
            tag={tag}
            sortBy={sortBy}
          />
        </AnalyticsContext>
      </SingleColumnSection>
      <div className={classNames(classes.columnSection, classes.aside)}>
        {tag?.tableOfContents?.html &&
          <ContentStyles contentType="tag">
            <div className={classNames(classes.wikiSidebar, classes.columnSection)} dangerouslySetInnerHTML={{ __html: truncateTagDescription(tag.tableOfContents.html, false) }} />
          </ContentStyles>
        }
      </div>
    </div>
  );
};

const TagSubforumPageComponent = registerComponent("TagSubforumPage", TagSubforumPage, { styles });

declare global {
  interface ComponentTypes {
    TagSubforumPage: typeof TagSubforumPageComponent;
  }
}
