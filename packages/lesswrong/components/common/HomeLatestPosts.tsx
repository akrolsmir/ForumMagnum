import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTimezone } from './withTimezone';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../../lib/filterSettings';
import moment from '../../lib/moment-timezone';
import {forumTypeSetting, taggingNamePluralSetting, taggingNameSetting} from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../posts/PostsPage/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';

const titleWrapper = forumTypeSetting.get() === 'LessWrong' ? {
  marginBottom: 8
} : {
  display: "flex",
  marginBottom: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const styles = (theme: ThemeType): JssStyles => ({
  titleWrapper,
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto"
  },
  toggleFilters: {
    [theme.breakpoints.up('sm')]: {
      display: "none"
    },
  },
  hide: {
      display: "none"
  }
})

const latestPostsName = forumTypeSetting.get() === 'EAForum' ? 'Frontpage Posts' : 'Latest Posts'

const HomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const currentUser = useCurrentUser();
  const location = useLocation();

  const {filterSettings, setPersonalBlogFilter, setTagFilter, removeTagFilter} = useFilterSettings()
  const [filterSettingsVisible, setFilterSettingsVisible] = useState(false);
  const { timezone } = useTimezone();
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible}, captureOnMount: true})
  const { query } = location;
  const { SingleColumnSection, PostsList2, TagFilterSettings, LWTooltip, SettingsButton, SectionTitle, CuratedPostsList } = Components
  const limit = parseInt(query.limit) || 13
  
  const now = moment().tz(timezone);
  const dateCutoff = now.subtract(90, 'days').format("YYYY-MM-DD");

  const recentPostsTerms = {
    ...query,
    filterSettings: filterSettings,
    after: dateCutoff,
    view: "magic",
    forum: true,
    limit:limit
  }

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <SectionTitle title={latestPostsName} noBottomPadding>
          <LWTooltip title={`Use these buttons to increase or decrease the visibility of posts based on ${taggingNameSetting.get()}. Use the "+" button to add additional ${taggingNamePluralSetting.get()} to boost or reduce them.`}>
            <SettingsButton
              label={filterSettingsVisible ?
                "Customize Feed (Hide)" :
                "Customize Feed (Show)"}
              showIcon={false}
              onClick={() => {
                setFilterSettingsVisible(!filterSettingsVisible)
                captureEvent("filterSettingsClicked", {
                  settingsVisible: !filterSettingsVisible,
                  settings: filterSettings,
                  pageSectionContext: "latestPosts"
                })
              }} />
          </LWTooltip>
        </SectionTitle>
  
        <AnalyticsContext pageSectionContext="tagFilterSettings">
              <div className={!filterSettingsVisible ? classes.hideOnMobile : null}>
                <TagFilterSettings
                  filterSettings={filterSettings} setPersonalBlogFilter={setPersonalBlogFilter} setTagFilter={setTagFilter} removeTagFilter={removeTagFilter}
                />
              </div>
          </AnalyticsContext>
        <HideRepeatedPostsProvider>
          {forumTypeSetting.get() === "EAForum" && <CuratedPostsList />}
          <AnalyticsContext listContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              <PostsList2 terms={recentPostsTerms} alwaysShowLoadMore hideHiddenFrontPagePosts>
                <Link to={"/allPosts"}>Advanced Sorting/Filtering</Link>
              </PostsList2>
            </AllowHidingFrontPagePostsContext.Provider>
          </AnalyticsContext>
        </HideRepeatedPostsProvider>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const HomeLatestPostsComponent = registerComponent('HomeLatestPosts', HomeLatestPosts, {styles});

declare global {
  interface ComponentTypes {
    HomeLatestPosts: typeof HomeLatestPostsComponent
  }
}
