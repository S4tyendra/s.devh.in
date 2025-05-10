import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post';

export default defineEventHandler(async (event) => {
  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");

  // Fetch URLs that have a 'reports' array and it's not empty,
  // or have a status (implying they've been involved in reporting).
  const query = {
    $or: [
      { reports: { $exists: true, $not: { $size: 0 } } },
      { status: { $exists: true } }
    ]
  };

  try {
    // Sort by the first report's date, descending (newest first)
    // If no reports array, sort by creation date or an arbitrary order.
    const reportedUrls = await collection.find(query)
      .sort({ "reports.0.reportedAt": -1, createdAt: -1 })
      .limit(100) // Add a limit for performance
      .toArray();
    
    return reportedUrls;
  } catch (error: any) {
    console.error("Error fetching reported URLs:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to fetch reported URLs."
    });
  }
});