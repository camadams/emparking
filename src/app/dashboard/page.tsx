"use client";
import React from "react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  useAuthenticate();

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-6">EmParking Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Parking Bay Management</CardTitle>
            <CardDescription>
              Register your bay, manage its availability, or find an available
              bay to use.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Use this section to register your parking bay, toggle its
              availability, and view available bays from other residents that
              you can claim.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/dashboard/bays">Manage Parking Bays</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example Feature</CardTitle>
            <CardDescription>
              View our example implementation with TanStack Query.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This is the original example feature showing how to implement data
              fetching and forms using TanStack Query.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild variant="outline">
              <Link href="/dashboard/dummy">View Example</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
