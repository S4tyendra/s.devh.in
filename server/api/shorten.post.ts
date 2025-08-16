import clientPromise from '~/server/utils/mongodb';
import validUrl from 'valid-url'; // We'll need to install this

function getRandomString(length: number) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomString = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    randomString += charset.charAt(randomIndex);
  }
  return randomString;
}

export interface ShortenedUrlDocument { // Add export here
  _id: string;
  originalUrl: string;
  pin?: string; // Legacy field, will be phased out
  createdAt: Date;
  status?: 'pending' | 'approved' | 'blocked'; // For reporting feature
  reports?: { reportedAt: Date; reason?: string }[]; // For storing report details
  click_count?: number; // New field for click tracking
  is_safe?: boolean; // New field for safety status (derived from status !== 'blocked')
}

export default defineEventHandler(async (event) => {
  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");
  const body = await readBody(event);

  const { originalUrl } = body;

  if (!originalUrl || !validUrl.isUri(originalUrl)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid URL provided',
    });
  }

  // PIN protection has been removed entirely as per requirements

  // Generate a unique short ID.
  // For simplicity, we'll try a few times if a collision occurs.
  // In a high-traffic system, a more robust approach would be needed.
  let shortId;
  let existing;
  let attempts = 0;
  const maxAttempts = 5; // Max attempts to find a unique ID

  do {
    shortId = getRandomString(5); // Keep 5 char length for compatibility
    existing = await collection.findOne({ _id: shortId });
    attempts++;
  } while (existing && attempts < maxAttempts);

  if (existing) {
    // If we still couldn't find a unique ID after several attempts
    throw createError({
      statusCode: 500,
      statusMessage: 'Could not generate a unique short URL. Please try again.',
    });
  }

  const newShortenedUrlEntry: ShortenedUrlDocument = {
    _id: shortId,
    originalUrl,
    createdAt: new Date(),
    // Initialize click_count and is_safe for client-side redirection
    // click_count will be incremented by the API endpoint
    // is_safe defaults to true (not blocked)
  };

  // PIN protection has been removed entirely as per requirements

  try {
    await collection.insertOne(newShortenedUrlEntry);
    // Construct the short URL. This might need adjustment based on your deployment.
    // For local dev, it might be http://localhost:3000/${shortId}
    // For production, it would be your domain.
    const requestHost = getRequestHost(event);
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const shortUrl = `${protocol}://${requestHost}/${shortId}`;

    return { shortUrl };
  } catch (error: any) {
    console.error("Error inserting into DB:", error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to shorten URL due to a database error.',
    });
  }
});