"use server";

import { db } from "@/db";
import { bayTable, availabilityTable, claimTable, user } from "@/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sql } from "drizzle-orm";

/**
 * Toggle a bay's availability status
 */
export async function toggleBayAvailability(
  bayId: number,
  isAvailable: boolean,
  availableFrom?: Date,
  availableUntil?: Date
) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Verify ownership
    const bay = await db
      .select()
      .from(bayTable)
      .where(and(eq(bayTable.id, bayId), eq(bayTable.ownerId, session.user.id)))
      .limit(1);

    if (!bay || bay.length === 0) {
      return {
        error: "Bay not found or you don't have permission to update it",
      };
    }

    // Get current availability
    const currentAvailability = await db
      .select()
      .from(availabilityTable)
      .where(eq(availabilityTable.bayId, bayId))
      .orderBy(desc(availabilityTable.updatedAt))
      .limit(1);

    // If there's an existing record, update it
    if (currentAvailability && currentAvailability.length > 0) {
      // Prepare the update object - keep existing values if new ones not provided
      const updateData: any = {
        isAvailable,
        updatedAt: new Date(),
      };

      // Only update date fields if new values are provided
      if (availableFrom !== undefined) {
        updateData.availableFrom = availableFrom;
      }

      if (availableUntil !== undefined) {
        updateData.availableUntil = availableUntil;
      }

      await db
        .update(availabilityTable)
        .set(updateData)
        .where(eq(availabilityTable.id, currentAvailability[0].id));
    } else {
      // Otherwise create a new availability record
      await db.insert(availabilityTable).values({
        bayId,
        isAvailable,
        availableFrom: availableFrom || null,
        availableUntil: availableUntil || null,
      });
    }

    return {
      message: `Availability updated successfully`,
    };
  } catch (error) {
    const errorMessage = "Error updating bay availability: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Get all currently available bays
 */
export async function getAvailableBays() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Get all bays with their availability info and check for active claims
    const availableBays = await db
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
        and(eq(bayTable.id, claimTable.bayId), isNull(claimTable.releasedAt))
      )
      .where(
        and(
          eq(availabilityTable.isAvailable, true),
          isNull(claimTable.id) // Only include bays with no active claims
        )
      );

    // Filter out bays that are outside their availability window
    const now = new Date();
    const filteredBays = availableBays.filter((item) => {
      const availableFrom = item.availability.availableFrom;
      const availableUntil = item.availability.availableUntil;

      // If no time constraints, it's available
      if (!availableFrom && !availableUntil) return true;

      // Check from time
      if (availableFrom && new Date(availableFrom) > now) return false;

      // Check until time
      if (availableUntil && new Date(availableUntil) < now) return false;

      return true;
    });

    return { availableBays: filteredBays };
  } catch (error) {
    const errorMessage = "Error fetching available bays: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}
