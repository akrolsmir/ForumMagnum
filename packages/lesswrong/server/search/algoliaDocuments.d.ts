
interface AlgoliaComment {
  objectID: string,
  _id: string,
  userId: string,
  baseScore: number,
  isDeleted: boolean,
  retracted: boolean,
  deleted: boolean,
  spam: boolean,
  legacy: boolean,
  userIP: string,
  createdAt: Date,
  postedAt: Date,
  af: boolean,
  authorDisplayName?: string,
  authorUserName?: string,
  authorSlug?: string,
  postId?: string,
  postTitle?: string,
  postSlug?: string,
  postSequenceId?: string,
  postIsEvent?: boolean,
  postGroupId?: string,
  tags: Array<string>, // an array of tag _ids that are associated with the comment, whether via tagId or via tagRels
  body: string,
  tagId?: string,
  tagName?: string,
  tagSlug?: string,
  tagCommentType?: string,
}

interface AlgoliaSequence {
  objectID: string,
  _id: string,
  title: string,
  userId: string,
  createdAt: Date,
  af: boolean,
  authorDisplayName?: string,
  authorUserName?: string,
  authorSlug?: string,
  plaintextDescription: string,
  bannerImageId?: string,
}

interface AlgoliaUser {
  _id: string,
  objectID: string,
  username: string,
  displayName: string,
  createdAt: Date,
  isAdmin: boolean,
  profileImageId?: string,
  bio: string,
  htmlBio: string,
  karma: number,
  slug: string,
  jobTitle?: string,
  organization?: string,
  website: string,
  groups: Array<string>,
  af: boolean,
  _geoloc?: {
    lat: number,
    lng: number
  },
  mapLocationAddress?: string,
  tags: Array<string>,
}

interface AlgoliaPost {
  _id: string,
  userId: string,
  url: string,
  title: string,
  slug: string,
  baseScore: number,
  status: number,
  curated: boolean,
  legacy: boolean,
  commentCount: number,
  userIP: string,
  createdAt: Date,
  postedAt: Date,
  isFuture: boolean,
  viewCount: number,
  lastCommentedAt: Date,
  draft: boolean,
  af: boolean,
  tags: Array<string>,
  authorSlug?: string,
  authorDisplayName?: string,
  authorFullName?: string,
  feedName?: string,
  feedLink?: string,
  body: string
}

interface AlgoliaTag {
  _id: string,
  objectID: string,
  name: string,
  slug: string,
  core: boolean,
  defaultOrder: number,
  suggestedAsFilter: boolean,
  postCount: number,
  wikiOnly: boolean,
  isSubforum: boolean,
  description: string,
  bannerImageId?: string,
}
