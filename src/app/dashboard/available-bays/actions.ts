"use server";

import { db } from "@/db";
import { bayTable, availabilityTable, claimTable, user } from "@/db/schema";
import { eq, and, isNull, desc, gt } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

/**
 * Claim an availability for use
 */
export async function claimBay(
  availabilityId: number,
  expectedDuration?: number
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Verify the availability exists
    const availability = await db
      .select()
      .from(availabilityTable)
      .where(eq(availabilityTable.id, availabilityId))
      .limit(1);

    if (!availability || availability.length === 0) {
      return { error: "Availability not found" };
    }

    // Check if the availability is active
    if (!availability[0].isAvailable) {
      return { error: "This availability is not active" };
    }

    // Check if there's already an active claim on this availability
    const activeClaims = await db
      .select()
      .from(claimTable)
      .where(
        and(
          eq(claimTable.availabilityId, availabilityId),
          isNull(claimTable.releasedAt)
        )
      )
      .limit(1);

    if (activeClaims && activeClaims.length > 0) {
      return { error: "This availability is already claimed by someone else" };
    }

    // Create the claim
    const [claim] = await db
      .insert(claimTable)
      .values({
        availabilityId,
        claimerId: session.user.id,
        expectedDuration: expectedDuration || null,
      })
      .returning();

    return {
      message: "Availability claimed successfully",
      claim,
    };
  } catch (error) {
    const errorMessage = "Error claiming availability: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Release a claimed availability
 */
export async function releaseBay(claimId: number) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Verify the claim exists and belongs to the user
    const claim = await db
      .select()
      .from(claimTable)
      .where(
        and(
          eq(claimTable.id, claimId),
          eq(claimTable.claimerId, session.user.id),
          isNull(claimTable.releasedAt)
        )
      )
      .limit(1);

    if (!claim || claim.length === 0) {
      return { error: "Claim not found or already released" };
    }

    // Release the claim
    await db
      .update(claimTable)
      .set({
        releasedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(claimTable.id, claimId));

    return {
      message: "Availability released successfully",
    };
  } catch (error) {
    const errorMessage = "Error releasing availability: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Get active claims by the current user
 */
export async function getMyActiveClaims() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Get all active claims by the user with availability information
    const activeClaims = await db
      .select({
        claim: claimTable,
        bay: bayTable,
        availability: availabilityTable,
        ownerName: user.name,
      })
      .from(claimTable)
      .innerJoin(
        availabilityTable,
        eq(claimTable.availabilityId, availabilityTable.id)
      )
      .innerJoin(bayTable, eq(availabilityTable.bayId, bayTable.id))
      .innerJoin(user, eq(bayTable.ownerId, user.id))
      .where(
        and(
          eq(claimTable.claimerId, session.user.id),
          isNull(claimTable.releasedAt)
        )
      );

    return { activeClaims };
  } catch (error) {
    const errorMessage = "Error fetching active claims: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Get future available bays (not yet available but will be in future)
 */
export async function getFutureAvailableBays() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Get all bays with future availability info and check for active claims
    const now = new Date();

    const data = await db
      .select({
        bay: bayTable,
        availability: availabilityTable,
        ownerName:
          sql<string>`(SELECT name FROM "user" WHERE id = ${bayTable.ownerId})`.as(
            "ownerName"
          ),
      })
      .from(bayTable)
      .innerJoin(availabilityTable, eq(bayTable.id, availabilityTable.bayId))
      .leftJoin(
        claimTable,
        and(
          eq(availabilityTable.id, claimTable.availabilityId),
          isNull(claimTable.releasedAt)
        )
      )
      .where(
        and(
          eq(availabilityTable.isAvailable, true),
          gt(availabilityTable.availableFrom, now), // Key difference: available in the future
          isNull(claimTable.id) // Only include bays with no active claims
        )
      );

    return { data };
  } catch (error) {
    const errorMessage = "Error fetching future available bays: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

export async function getAvailableBays2() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    const data = await db
      .select({
        bay: bayTable,
        availability: availabilityTable,
        ownerName: user.name,
      })
      .from(bayTable)
      .leftJoin(availabilityTable, eq(bayTable.id, availabilityTable.bayId))
      .leftJoin(user, eq(bayTable.ownerId, user.id));

    return { data };
  } catch (error) {
    const errorMessage = "Error fetching available bays: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

export async function getAvailablilties() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "You must be logged in" };
  }

  const data = await db
    .select({
      availability: availabilityTable,
      bay: bayTable,
      ownerName: user.name,
    })
    .from(availabilityTable)
    .innerJoin(bayTable, eq(availabilityTable.bayId, bayTable.id))
    .innerJoin(user, eq(bayTable.ownerId, user.id))
    .where(eq(bayTable.isVisible, true));

  return { data };
}
