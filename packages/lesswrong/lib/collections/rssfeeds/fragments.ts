import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment RSSFeedMinimumInfo on RSSFeed {
    _id
    userId
    user {
      ...UsersMinimumInfo
    }
    createdAt
    ownedByUser
    displayFullContent
    nickname
    url
  }
`);

registerFragment(`
  fragment newRSSFeedFragment on RSSFeed {
    _id
    userId
    createdAt
    ownedByUser
    displayFullContent
    nickname
    url
    status
  }
`);



registerFragment(`
  fragment RSSFeedMutationFragment on RSSFeed {
    _id
    userId
    ownedByUser
    displayFullContent
    nickname
    url
  }
`);
