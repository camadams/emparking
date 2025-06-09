"use server";

import { db } from "@/db";
import { bayTable, availabilityTable, claimTable } from "@/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

/**
 * Claim a bay for use
 */
export async function claimBay(bayId: number, expectedDuration?: number) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Verify the bay exists
    const bay = await db
      .select()
      .from(bayTable)
      .where(eq(bayTable.id, bayId))
      .limit(1);

    if (!bay || bay.length === 0) {
      return { error: "Bay not found" };
    }

    // Check if the bay is available
    const availability = await db
      .select()
      .from(availabilityTable)
      .where(eq(availabilityTable.bayId, bayId))
      .orderBy(desc(availabilityTable.updatedAt))
      .limit(1);

    if (
      !availability ||
      availability.length === 0 ||
      !availability[0].isAvailable
    ) {
      return { error: "This bay is not available for use" };
    }

    // Check if there's already an active claim on this bay
    const activeClaims = await db
      .select()
      .from(claimTable)
      .where(and(eq(claimTable.bayId, bayId), isNull(claimTable.releasedAt)))
      .limit(1);

    if (activeClaims && activeClaims.length > 0) {
      return { error: "This bay is already claimed by someone else" };
    }

    // Create the claim
    const [claim] = await db
      .insert(claimTable)
      .values({
        bayId,
        claimerId: session.user.id,
        expectedDuration: expectedDuration || null,
      })
      .returning();

    return {
      message: "Bay claimed successfully",
      claim,
    };
  } catch (error) {
    const errorMessage = "Error claiming bay: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Release a claimed bay
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
      message: "Bay released successfully",
    };
  } catch (error) {
    const errorMessage = "Error releasing bay: " + error;
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

    // Get all active claims by the user
    const activeClaims = await db
      .select({
        claim: claimTable,
        bay: bayTable,
        ownerName:
          sql<string>`(SELECT name FROM "user" WHERE id = ${bayTable.ownerId})`.as(
            "ownerName"
          ),
      })
      .from(claimTable)
      .innerJoin(bayTable, eq(claimTable.bayId, bayTable.id))
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
