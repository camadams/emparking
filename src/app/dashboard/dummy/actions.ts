"use server";

import { db } from "@/db";
import { dummyTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getDummyData() {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });

  if (!session?.user?.id) {
    return { error: "You must be logged in" };
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
