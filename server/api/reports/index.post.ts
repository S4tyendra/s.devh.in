import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { slug, reason } = body;

  if (!slug || typeof slug !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Short URL slug is required.' });
  }

  const client = await clientPromise;
  const db = client.db("urlShortener");
  const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");

  const existingUrl = await collection.findOne({ _id: slug });

  if (!existingUrl) {
    throw createError({ statusCode: 404, statusMessage: 'The specified short URL slug was not found.' });
  }

  // Prevent reporting already blocked URLs excessively, though admins can override.
  if (existingUrl.status === 'blocked') {
     // We can allow re-reporting if desired, or just inform.
    // For now, let's inform and not add a new report entry if already blocked.
    return { message: `URL /${slug} is already blocked. No new report added.`, existingStatus: 'blocked' };
  }

  const newReportEntry = {
    reportedAt: new Date(),
    reason: reason || undefined, // Store reason if provided
    // Potentially add reporter IP/User-Agent for moderation, respecting privacy.
  };

  try {
    const result = await collection.updateOne(
      { _id: slug },
      {
        $push: { reports: newReportEntry },
        $set: { status: 'pending' } // Set status to pending on new report if not already set or if it was 'approved'
        // $setOnInsert: { createdAt: new Date() } // Not needed here as we're updating
      }
    );

    if (result.matchedCount === 0) {
      // This should not happen if findOne found it, but as a safeguard.
      throw createError({ statusCode: 404, statusMessage: 'Failed to find the URL to update for reporting.' });
    }
    
    // If it was already 'pending', the message can reflect that.
    // If it was 'approved' and now 'pending', that's also good to know.
    let message = `Report for /${slug} submitted successfully. It will be reviewed.`;
    if(existingUrl.status === 'pending') {
        message = `Additional report for /${slug} submitted. It is still pending review.`;
    } else if (existingUrl.status === 'approved') {
        message = `Report for /${slug} (previously approved) submitted. It is now pending review.`;
    }


    return { message, newStatus: 'pending' };
  } catch (error: any) {
    console.error(`Error submitting report for slug ${slug}:`, error);
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to submit report due to a server error.'
    });
  }
});