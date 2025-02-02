import { getUserFromReq } from '../vulcan-lib/apollo-server/context';
import { Posts } from '../../lib/collections/posts'
import { getCollaborativeEditorAccess, CollaborativeEditingAccessLevel } from '../../lib/collections/posts/collabEditingPermissions';
import { getCKEditorDocumentId } from '../../lib/ckEditorUtils'
import { userGetDisplayName } from '../../lib/collections/users/helpers';
import { getCkEditorEnvironmentId, getCkEditorSecretKey } from './ckEditorServerConfig';
import jwt from 'jsonwebtoken'

function permissionsLevelToCkEditorRole(access: CollaborativeEditingAccessLevel): string {
  switch (access) {
    case "edit": return "writer";
    case "comment": return "commentator";
    case "read": return "reader";
    case "none": return "";
  }
}

export async function ckEditorTokenHandler (req, res, next) {
  const environmentId = getCkEditorEnvironmentId();
  const secretKey = getCkEditorSecretKey()!; // Assume nonnull; causes lack of encryption in development

  const collectionName = req.headers['collection-name'];
  const documentId = req.headers['document-id'];
  const userId = req.headers['user-id'];
  const formType = req.headers['form-type'];
  
  if (Array.isArray(collectionName)) throw new Error("Multiple collectionName headers");
  if (Array.isArray(documentId)) throw new Error("Multiple documentId headers");
  if (Array.isArray(userId)) throw new Error("Multiple userId headers");
  if (Array.isArray(formType)) throw new Error("Multiple formType headers");
  
  const user = await getUserFromReq(req);
  
  if (collectionName === "Posts") {
    const ckEditorId = getCKEditorDocumentId(documentId, userId, formType)
    const post = documentId && await Posts.findOne(documentId);
    const access = documentId ? await getCollaborativeEditorAccess({ formType, post, user, useAdminPowers: true }) : "edit";
  
    if (access === "none") {
      res.writeHead(403, {});
      res.end("Access denied")
      return;
    }
    
    const payload = {
      iss: environmentId,
      user: user ? {
        id: user._id,
        name: userGetDisplayName(user)
      } : null,
      auth: {
        collaboration: {
          [ckEditorId]: {role: permissionsLevelToCkEditorRole(access)}
        },
      },
    };
    
    const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
    
    res.writeHead(200, {
      "Content-Type": "application/octet-stream"
    });
    res.end(result);
  } else {
    const payload = {
      iss: environmentId,
      user: user ? {
        id: user._id,
        name: userGetDisplayName(user)
      } : null,
    };
    
    const result = jwt.sign( payload, secretKey, { algorithm: 'HS256' } );
    
    res.writeHead(200, {
      "Content-Type": "application/octet-stream"
    });
    res.end(result);
  }
}
