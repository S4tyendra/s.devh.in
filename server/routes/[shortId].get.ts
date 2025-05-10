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
    // Redirect to a 404 page or home with an error
    // For now, simple 404
    // In Nuxt, you might use sendRedirect(event, '/not-found?url=' + shortId, 302)
    // or throw createError({ statusCode: 404, statusMessage: 'URL not found' });
    // return sendRedirect(event, '/?error=URL_NOT_FOUND', 307); // Temporary redirect
     throw createError({ statusCode: 404, statusMessage: 'URL not found. The short link may have expired or never existed.' });
  }

  if (entry.status === 'blocked') {
    // Potentially show a specific page for blocked URLs
    throw createError({ statusCode: 403, statusMessage: 'This URL has been blocked due to reports.' });
  }

  if (entry.pin) {
    // If PIN protected, redirect to the PIN entry page
    return sendRedirect(event, `/p/${shortId}`, 302);
  }
  // If no PIN and status is not blocked, redirect to the original URL
  return sendRedirect(event, entry.originalUrl, 302); // 302 Found - common for temporary redirects
});