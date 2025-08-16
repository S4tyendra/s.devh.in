import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post';

// Extended interface to include new fields for client-side redirection
interface ExtendedShortenedUrlDocument extends ShortenedUrlDocument {
  click_count?: number;
  is_safe?: boolean;
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug');

  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'Slug is required' });
  }

  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ExtendedShortenedUrlDocument>("shortenedUrls");

  try {
    const entry = await collection.findOne({ _id: slug });

    if (!entry) {
      throw createError({ 
        statusCode: 404, 
        statusMessage: 'URL not found',
        data: { error: "URL not found" }
      });
    }

    // Increment click count
    await collection.updateOne(
      { _id: slug },
      { $inc: { click_count: 1 } }
    );

    // Get updated click count
    const updatedEntry = await collection.findOne({ _id: slug });
    const clickCount = updatedEntry?.click_count || 1;

    // Determine if URL is safe (not blocked)
    const isSafe = entry.status !== 'blocked';

    // Construct the short URL
    const requestHost = getRequestHost(event);
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const shortUrl = `${protocol}://${requestHost}/${slug}`;

    // Return the response matching the required schema
    return {
      $schema: "https://devh.in/schemas/RedirectShortURLOutputBody.json",
      url: shortUrl,
      original_url: entry.originalUrl,
      slug: slug,
      click_count: clickCount,
      created_at: entry.createdAt?.toISOString() || new Date().toISOString(),
      is_safe: isSafe
    };

  } catch (error: any) {
    // Handle the 404 case specifically
    if (error.statusCode === 404) {
      throw error;
    }
    
    console.error(`Error fetching URL data for slug ${slug}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});