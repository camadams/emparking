"use server";

import { db } from "@/db";
import { availabilityTable, bayTable, dummyTable } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getDummyData() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "You must be logged in." };
  }

  const response = await db
    .select()
    .from(dummyTable)
    .where(eq(dummyTable.userId, session.user.id));
  return { response };
}

export async function addDummyData(name: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    if (!name || name.trim().length < 2) {
      return { error: "Name must be at least 2 characters" };
    }

    await db.insert(dummyTable).values({
      name,
      userId: session.user.id,
    });

    return { message: "Added successfully" };
  } catch (error) {
    const errorMessage = "Error adding data: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

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
