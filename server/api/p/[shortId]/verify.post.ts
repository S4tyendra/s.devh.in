import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post';

export default defineEventHandler(async (event) => {
  const shortId = getRouterParam(event, 'shortId');
  const body = await readBody(event);
  const { pin: submittedPin } = body;

  if (!shortId) {
    throw createError({ statusCode: 400, statusMessage: 'Short ID is required' });
  }

  if (!submittedPin || typeof submittedPin !== 'string' || !/^\d{4,6}$/.test(submittedPin)) {
    throw createError({ statusCode: 400, statusMessage: 'Valid PIN (4-6 digits) is required' });
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

  if (!entry.pin) {
    // This case should ideally not be reached if the /p/:shortId page only loads for PIN-protected URLs.
    // However, as a safeguard:
    // If it's not PIN protected, but they are trying to verify, just give them the URL.
    return { originalUrl: entry.originalUrl, message: 'URL is not PIN protected.' };
  }

  if (entry.pin === submittedPin) {
    return { originalUrl: entry.originalUrl };
  } else {
    throw createError({ statusCode: 401, statusMessage: 'Invalid PIN' });
  }
});