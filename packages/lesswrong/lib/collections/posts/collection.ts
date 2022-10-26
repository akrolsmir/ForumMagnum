import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { userOwns, userCanDo, userIsMemberOf, userIsPodcaster } from '../../vulcan-users/permissions';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from './helpers';
import { makeEditable } from '../../editor/make_editable';
import { formGroups } from './formGroups';
import { allOf } from '../../utils/functionUtils';

export const userCanPost = (user: UsersCurrent|DbUser) => {
  if (user.deleted) return false;
  if (user.postingDisabled) return false
  return userCanDo(user, 'posts.new')
}

const options: MutationOptions<DbPost> = {
  newCheck: (user: DbUser|null) => {
    if (!user) return false;
    return userCanPost(user)
  },

  editCheck: async (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    if (userCanDo(user, 'posts.alignment.move.all') ||
        userCanDo(user, 'posts.alignment.suggest') ||
        userIsMemberOf(user, 'canSuggestCuration')) {
      return true
    }

    
    return canUserEditPostMetadata(user, document) || userIsPodcaster(user) || await userIsPostGroupOrganizer(user, document)
    // note: we can probably get rid of the userIsPostGroupOrganizer call since that's now covered in canUserEditPostMetadata, but the implementation is slightly different and isn't otherwise part of the PR that restrutured canUserEditPostMetadata
  },

  removeCheck: (user: DbUser|null, document: DbPost|null) => {
    if (!user || !document) return false;
    return userOwns(user, document) ? userCanDo(user, 'posts.edit.own') : userCanDo(user, `posts.edit.all`)
  },
}

interface ExtendedPostsCollection extends PostsCollection {
  getSocialPreviewImage: (post: DbPost) => string
  // In search/utils.ts
  toAlgolia: (post: DbPost) => Promise<Array<AlgoliaDocument>|null>
}

export const Posts: ExtendedPostsCollection = createCollection({
  collectionName: 'Posts',
  typeName: 'Post',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('Posts'),
  mutations: getDefaultMutations('Posts', options),
  logChanges: true,
});

const userHasModerationGuidelines = (currentUser: DbUser|null): boolean => {
  return !!(currentUser && ((currentUser.moderationGuidelines && currentUser.moderationGuidelines.html) || currentUser.moderationStyle))
}

addUniversalFields({
  collection: Posts,
  createdAtOptions: {viewableBy: ['admins']},
});

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.content,
    order: 25,
    pingbacks: true,
    permissions: {
      viewableBy: ['guests'],
      // TODO: we also need to cover userIsPostGroupOrganizer somehow, but we can't right now since it's async
      editableBy: ['members', 'sunshineRegiment', 'admins'],
      insertableBy: ['members']
    },
  }
})

makeEditable({
  collection: Posts,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    formGroup: formGroups.moderationGroup,
    order: 50,
    fieldName: "moderationGuidelines",
    permissions: {
      viewableBy: ['guests'],
      editableBy: ['members', 'sunshineRegiment', 'admins'],
      insertableBy: [userHasModerationGuidelines]
    },
  }
})

makeEditable({
  collection: Posts,
  options: {
    formGroup: formGroups.highlight,
    fieldName: "customHighlight",
    permissions: {
      viewableBy: ['guests'],
      editableBy: ['sunshineRegiment', 'admins'],
      insertableBy: ['sunshineRegiment', 'admins'],
    },
  }
})


export default Posts;
