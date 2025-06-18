"use server";

import { db } from "@/db";
import { bayTable, availabilityTable, claimTable, user } from "@/db/schema";
import { eq, and, isNull, ne, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Register a new bay for the current user
 */
export async function registerBay(label: string, confirmOwnership: boolean) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    if (!label || label.trim().length < 1) {
      return { error: "Bay label is required" };
    }

    if (!confirmOwnership) {
      return { error: "You must confirm that this is your bay" };
    }

    // Check if the user already has a bay
    const existingBays = await db
      .select()
      .from(bayTable)
      .where(eq(bayTable.ownerId, session.user.id));

    if (existingBays.length > 0) {
      return { error: "You already have a registered bay" };
    }

    // Check if a bay with this label already exists
    const existingBayWithLabel = await db
      .select()
      .from(bayTable)
      .where(eq(bayTable.label, label.trim()));

    if (existingBayWithLabel.length > 0) {
      return {
        error:
          "A bay with this label already exists. Please enter a unique label.",
      };
    }

    // Create the bay record
    const [bay] = await db
      .insert(bayTable)
      .values({
        label: label.trim(),
        ownerId: session.user.id,
      })
      .returning();

    // Create initial availability record (default unavailable)
    await db.insert(availabilityTable).values({
      bayId: bay.id,
      isAvailable: false,
    });

    return {
      message: "Bay registered successfully",
      bay,
    };
  } catch (error) {
    const errorMessage = "Error registering bay: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Get the bay owned by the current user
 */
export async function getMyBay() {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    // Get the bay owned by the user
    const bay = await db
      .select()
      .from(bayTable)
      .where(eq(bayTable.ownerId, session.user.id))
      .limit(1);

    if (!bay || bay.length === 0) {
      console.log("No bay found");
      return { bay: null };
    }

    // Get the latest availability for this bay
    const availability = await db
      .select()
      .from(availabilityTable)
      .where(eq(availabilityTable.bayId, bay[0].id))
      .orderBy(availabilityTable.updatedAt);

    // Get active claim for this bay (if any)
    const activeClaims = await db
      .select({
        claim: claimTable,
        claimer: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
        availability: availabilityTable,
      })
      .from(claimTable)
      .innerJoin(
        availabilityTable,
        eq(claimTable.availabilityId, availabilityTable.id)
      )
      .where(
        and(
          eq(availabilityTable.bayId, bay[0].id),
          isNull(claimTable.releasedAt)
        )
      )
      .innerJoin(user, eq(claimTable.claimerId, user.id))
      .orderBy(desc(claimTable.claimedAt))
      .limit(1);

    return {
      bay: bay[0],
      availability: availability || null,
      activeClaim:
        activeClaims.length > 0
          ? {
              ...activeClaims[0].claim,
              claimer: activeClaims[0].claimer,
            }
          : null,
    };
  } catch (error) {
    const errorMessage = "Error fetching bay: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

/**
 * Update a bay's label
 */
export async function updateBayLabel(bayId: number, newLabel: string) {
  try {
    const headersList = await headers();
    const session = await auth.api.getSession({ headers: headersList });

    if (!session?.user?.id) {
      return { error: "You must be logged in" };
    }

    if (!newLabel || newLabel.trim().length < 1) {
      return { error: "Bay label is required" };
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

    // Check if a bay with this label already exists (excluding the current bay)
    const existingBayWithLabel = await db
      .select()
      .from(bayTable)
      .where(
        and(
          eq(bayTable.label, newLabel.trim()),
          ne(bayTable.id, bayId) // Not equal to current bay ID
        )
      );

    if (existingBayWithLabel.length > 0) {
      return {
        error:
          "A bay with this label already exists. Please enter a unique label.",
      };
    }

    // Update the bay label
    await db
      .update(bayTable)
      .set({
        label: newLabel.trim(),
        updatedAt: new Date(),
      })
      .where(eq(bayTable.id, bayId));

    return { message: "Bay updated successfully" };
  } catch (error) {
    const errorMessage = "Error updating bay: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}

export async function toggleBayAvailability(
  bayId: number,
  isVisible: boolean,
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

    // Update bay visibility status
    await db
      .update(bayTable)
      .set({
        isVisible: isVisible,
        updatedAt: new Date(),
      })
      .where(eq(bayTable.id, bayId));

    // If dates were provided, update or create an availability record
    if (availableFrom && availableUntil) {
      // Get current availability
      const currentAvailability = await db
        .select()
        .from(availabilityTable)
        .where(eq(availabilityTable.bayId, bayId))
        .orderBy(desc(availabilityTable.updatedAt))
        .limit(1);

      // If there's an existing record, update it
      if (currentAvailability && currentAvailability.length > 0) {
        await db
          .update(availabilityTable)
          .set({
            isAvailable: isVisible, // Match isAvailable with isVisible for compatibility
            availableFrom: availableFrom,
            availableUntil: availableUntil,
            updatedAt: new Date(),
          })
          .where(eq(availabilityTable.id, currentAvailability[0].id));
      } else {
        // Otherwise create a new availability record
        await db.insert(availabilityTable).values({
          bayId,
          isAvailable: isVisible, // Match isAvailable with isVisible for compatibility
          availableFrom: availableFrom,
          availableUntil: availableUntil,
        });
      }
    }

    return {
      message: `Bay visibility updated successfully`,
    };
  } catch (error) {
    const errorMessage = "Error updating bay visibility: " + error;
    console.error(errorMessage);
    return { error: errorMessage };
  }
}
