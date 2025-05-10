import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post';

// Basic admin check middleware (simplified)
// In a real app, use proper auth (e.g. Lucia, nuxt-auth, or custom JWT/session middleware)
const isAdminAuthenticated = (event: any): boolean => {
  // This is a placeholder.
  // We are relying on a cookie 'isAdmin' set by the client after successful login.
  // The server should ideally verify this cookie against a secure session or token.
  // For this example, we'll check for a specific header or rely on the cookie if present.
  const isAdminCookie = getCookie(event, 'isAdmin');
  return isAdminCookie === 'true'; // Ensure it's the string 'true'
};

export default defineEventHandler(async (event) => {
  if (!isAdminAuthenticated(event)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden. Admin access required.',
    });
  }

  const slug = getRouterParam(event, 'slug');
  const body = await readBody(event);
  const { status: newStatus } = body;

  if (!slug || typeof slug !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Short URL slug is required.' });
  }

  const validStatuses = ['pending', 'approved', 'blocked'];
  if (!newStatus || typeof newStatus !== 'string' || !validStatuses.includes(newStatus)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid status. Must be one of: ${validStatuses.join(', ')}.` });
  }

  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");

  try {
    const result = await collection.updateOne(
      { _id: slug },
      { $set: { status: newStatus as 'pending' | 'approved' | 'blocked' } }
    );

    if (result.matchedCount === 0) {
      throw createError({ statusCode: 404, statusMessage: 'The specified short URL slug was not found.' });
    }
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        return { message: `Status for /${slug} is already ${newStatus}. No change made.` };
    }

    return { message: `Status for /${slug} successfully updated to ${newStatus}.` };
  } catch (error: any) {
    // Handle known createError issues, otherwise generic server error
    if (error.statusCode) throw error; 
    
    console.error(`Error updating status for slug ${slug}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to update status due to a server error.'
    });
  }
});