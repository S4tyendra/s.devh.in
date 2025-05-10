import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post';

export default defineEventHandler(async (event) => {
  const shortId = getRouterParam(event, 'shortId');

  if (!shortId) {
    throw createError({ statusCode: 400, statusMessage: 'Short ID is required' });
  }

  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");

  const entry = await collection.findOne({ _id: shortId });

  if (!entry) {
    throw createError({ statusCode: 404, statusMessage: 'URL not found' });
  }

  if (entry.status === 'blocked') {
    throw createError({ statusCode: 403, statusMessage: 'This URL has been blocked.' });
  }

  return {
    protected: !!entry.pin, // True if PIN exists, false otherwise
    // Potentially add other non-sensitive info if needed
  };
});