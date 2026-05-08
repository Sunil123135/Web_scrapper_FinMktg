import { createClerkClient, verifyToken } from "@clerk/backend";
import { eq } from "drizzle-orm";
import type { VercelRequest } from "@vercel/node";
import { db, schema } from "./db.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

function getBearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

export async function requireUser(req: VercelRequest): Promise<AuthenticatedUser> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is required");
  }

  const token = getBearerToken(req);
  if (!token) {
    throw Object.assign(new Error("Missing bearer token"), { statusCode: 401 });
  }

  const verified = await verifyToken(token, { secretKey });
  const userId = verified.sub;

  if (!userId) {
    throw Object.assign(new Error("Invalid session token"), { statusCode: 401 });
  }

  const clerk = createClerkClient({ secretKey });
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.primaryEmailAddress?.emailAddress;

  if (!email) {
    throw Object.assign(new Error("Signed-in user has no primary email"), { statusCode: 400 });
  }

  const user: AuthenticatedUser = {
    id: userId,
    email,
    name: [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || clerkUser.username || null,
    imageUrl: clerkUser.imageUrl ?? null,
  };

  await db
    .insert(schema.users)
    .values({
      id: user.id,
      email: user.email,
      name: user.name,
      imageUrl: user.imageUrl,
      authProvider: "clerk",
    })
    .onConflictDoUpdate({
      target: schema.users.id,
      set: {
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
      },
    });

  const existingProfile = await db.query.interestProfiles.findFirst({
    where: eq(schema.interestProfiles.userId, user.id),
  });

  if (!existingProfile) {
    await db.insert(schema.interestProfiles).values({
      userId: user.id,
      domain: "other",
      profileText: "",
    });
  }

  return user;
}
