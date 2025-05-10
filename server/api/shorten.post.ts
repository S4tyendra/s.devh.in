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
  pin?: string;
  createdAt: Date;
  status?: 'pending' | 'approved' | 'blocked'; // For reporting feature
  reports?: { reportedAt: Date; reason?: string }[]; // For storing report details
}

export default defineEventHandler(async (event) => {
  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");
  const body = await readBody(event);

  const { originalUrl, pin } = body;

  if (!originalUrl || !validUrl.isUri(originalUrl)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid URL provided',
    });
  }

  if (pin) {
    if (typeof pin !== 'string' || !/^\d{4,6}$/.test(pin)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'PIN must be 4 to 6 digits.',
      });
    }
  }

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
  };

  if (pin) {
    newShortenedUrlEntry.pin = pin; // Store the PIN as-is
  }

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