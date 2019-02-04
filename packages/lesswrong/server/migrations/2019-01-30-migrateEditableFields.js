import { Votes } from '../../lib/collections/votes';
import { Posts } from '../../lib/collections/posts'
import { registerMigration, migrateDocuments, fillDefaultValues } from './migrationUtils';
import { Collections } from 'meteor/vulcan:core';

function determineCanonicalType({ draftJS, lastEditedAs }) {
  if (lastEditedAs) { return lastEditedAs }
  if (draftJS) { return "draftJS" }
  return "html"
}

registerMigration({
  name: "migrateEditableFields",
//   idempotent: true,
  action: async () => {
    await migrateDocuments({
      description: "Migrate old posts",
      collection: Posts,
      batchSize: 100,
      unmigratedDocumentQuery: {
        htmlBody: {$exists: true}
      }, 
      migrate: async (documents) => {
        const updates = documents.map(post => {
          return {
            updateOne: {
              filter: {_id: post._id},
              update: {
                $set: {
                  contents: {
                      originalContents: {
                          type: determineCanonicalType({draftJS: post.content, lastEditedAs: post.lastEditedAs}),
                          data: "htmlReference"
                      },
                      html: "htmlReference", 
                      version: "1.0.0", 
                      userId: "userIdReference", 
                      editedAt: "postedAtReference" 
                  }
                }
              }
            }
          }
        })
      }
    })
    await migrateDocuments({
      description: "Fill in authorId field",
      collection: Votes,
      batchSize: 100,
      unmigratedDocumentQuery: {
        authorId: {$exists:false},
      },
      migrate: async (documents) => {
        // Get the set of collections that at least one vote in the batch
        // is voting on
        const collectionNames = _.uniq(_.pluck(documents, "collectionName"))
        
        for(let collectionName of collectionNames) {
          const collection = _.find(Collections, c => c.collectionName==collectionName);
          
          // Go through the votes in the batch and pick out IDs of voted-on
          // documents in this collection.
          const votesToUpdate = _.filter(documents, doc => doc.collectionName==collectionName)
          const idsToFind = _.pluck(votesToUpdate, "documentId");
          
          // Retrieve the voted-on documents.
          const votedDocuments = collection.find({
            _id: {$in: idsToFind}
          }).fetch();
          
          // Extract author IDs from the voted-on documents.
          let authorIdsByDocument = {};
          _.each(votedDocuments, doc => authorIdsByDocument[doc._id] = doc.userId);
          
          // Fill in authorId on the votes.
          const updates = _.map(votesToUpdate, vote => {
            return {
              updateOne: {
                filter: {_id: vote._id},
                update: {
                  $set: {
                    authorId: authorIdsByDocument[vote.documentId]
                  }
                },
                upsert: false,
              }
            };
          });
          await Votes.rawCollection().bulkWrite(
            updates,
            { ordered: false }
          );
        }
      },
    });
    
    await fillDefaultValues({
      collection: Votes,
      fieldName: "cancelled",
    });
    await fillDefaultValues({
      collection: Votes,
      fieldName: "isUnvote",
    });
  },
});