export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user, password } = body;

  const adminUser = process.env.USER;
  const adminPassword = process.env.PASSWORD;

  if (!adminUser || !adminPassword) {
    console.error("Admin user/password not set in .env");
    throw createError({
      statusCode: 500,
      statusMessage: "Admin authentication is not configured on the server.",
    });
  }

  if (user === adminUser && password === adminPassword) {
    // In a real app, you'd set up a secure session or JWT.
    // For this example, we're relying on a cookie set by the client-side,
    // and subsequent admin-only endpoints should re-verify.
    // Nuxt auth modules (e.g., nuxt-auth, sidebase-auth) are better for this.
    return { success: true, message: "Admin login successful." };
  } else {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid admin credentials.",
    });
  }
});