import clientPromise from '~/server/utils/mongodb';
import type { ShortenedUrlDocument } from '~/server/api/shorten.post'; // Ensure this path is correct

// Helper to check if a path segment looks like our short ID (e.g., 5 alphanumeric chars)
const isValidShortIdFormat = (id: string): boolean => {
  if (typeof id !== 'string') return false;
  return /^[a-zA-Z0-9]{5}$/.test(id);
};

export default defineEventHandler(async (event) => {
  const path = event.node.req.url;

  // 1. Immediately ignore common Nuxt paths, API calls, specific known assets, or paths with extensions
  if (!path || path.startsWith('/_nuxt') || path.startsWith('/api/') || path.startsWith('/@vite') || path.startsWith('/@id') || path.includes('.') && path.split('.').pop() !== 'well-known') { // Allow .well-known
    return; // Let Nuxt handle these
  }

  // 2. Define known page routes or prefixes that should not be treated as shortIds
  // Add any other root-level page routes here.
  const pageRoutePrefixes = ['/bulk', '/report', '/p'];

  if (path === '/') {
    return; // Explicitly let Nuxt handle the root page
  }

  if (pageRoutePrefixes.some(prefix => path.startsWith(prefix))) {
    // Further check for /p/[shortId] case if needed, but generally let Nuxt handle prefixed page routes
    return; 
  }
  
  // 3. If not an ignored path, extract potential shortId
  // It should be a single segment like /xyz12
  const pathSegments = path.split('?')[0].split('/'); // Remove query params, then split by /
                                                    // For "/xyz12", segments are ["", "xyz12"]
                                                    // For "/", segments are ["", ""]

  if (pathSegments.length === 2 && pathSegments[0] === '' && isValidShortIdFormat(pathSegments[1])) {
    const shortId = pathSegments[1];

    try {
      const client = await clientPromise;
      const db = client.db("urlShortener");
      const collection = db.collection<ShortenedUrlDocument>("shortenedUrls");
      const entry = await collection.findOne({ _id: shortId });

      if (entry) {
        if (entry.status === 'blocked') {
          setResponseStatus(event, 403);
          // Consider creating a static error page or a specific route for this
          return send(event, 'This URL has been blocked.'); 
        }
        if (entry.pin) {
          return sendRedirect(event, `/p/${shortId}`, 302); // Redirect to PIN entry page
        }
        return sendRedirect(event, entry.originalUrl, 302); // Actual redirect
      }
      // If a validly formatted shortId is not found, let Nuxt proceed to its 404 handling for pages.
      // This middleware won't throw a 404 itself, to give a chance for a potential page like /about (if it matched format by chance)
      return;

    } catch (dbError) {
      console.error(`Database error during redirect for ${shortId}:`, dbError);
      // Optionally, send a generic server error. Otherwise, let Nuxt handle it.
      // setResponseStatus(event, 500);
      // return send(event, 'Server error during redirection.');
      return; // Let Nuxt handle
    }
  }

  // If the path doesn't match a short ID format, or is a known page/asset,
  // this middleware does nothing, allowing Nuxt to process other routes (pages).
  return;
});