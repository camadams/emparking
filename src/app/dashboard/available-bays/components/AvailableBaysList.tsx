"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format, intervalToDuration } from "date-fns";

interface AvailableBaysListProps {
  availableBays: any;
  claimsData: any;
  onClaimBay: (
    bayId: number,
    availableUntil: Date | null,
    isFutureAvailability?: boolean
  ) => Promise<void>;
  now: Date;
}

export default function AvailableBaysList({
  availableBays,
  claimsData,
  onClaimBay,
  now,
}: AvailableBaysListProps) {
  // Show available bays
  const renderAvailableBays = () => {
    if (!availableBays?.data || availableBays.data.length === 0) {
      return (
        <p className="text-muted-foreground">
          No bays are currently available.
        </p>
      );
    }

    // console.log(availableBays?.data);

    // Create a map of claimed bay IDs for quick lookup
    const claimedBayIds = new Set(
      (claimsData?.activeClaims || []).map((item: any) => item.bay.id)
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableBays.data
          .filter(
            (item: any) =>
              item.availability?.isAvailable &&
              item.availability?.availableUntil &&
              item.availability?.availableUntil > now &&
              item.availability?.availableFrom &&
              item.availability?.availableFrom < now
          )
          .map((item: any) => (
            <Card key={item.bay.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Bay {item.bay.label}</CardTitle>
                <CardDescription>Owner: {item.ownerName}</CardDescription>
              </CardHeader>
              <CardContent className="bg-muted">
                <p>
                  Available from:{" "}
                  {item.availability?.availableFrom
                    ? format(item.availability.availableFrom, "p eeee, do MMM")
                    : "Error"}
                </p>
                <p>
                  Available until:{" "}
                  {item.availability?.availableUntil
                    ? format(item.availability.availableUntil, "p eeee, do MMM")
                    : "Error"}
                </p>
              </CardContent>
              <CardFooter className="border-t">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    onClaimBay(item.bay.id, item.availability?.availableUntil!)
                  }
                  disabled={claimedBayIds.has(item.bay.id)}
                >
                  {claimedBayIds.has(item.bay.id)
                    ? "Already Claimed"
                    : "Claim Bay"}
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    );
  };

  // Show future available bays
  const renderFutureAvailableBays = () => {
    if (!availableBays?.data || availableBays.data.length === 0) {
      return (
        <p className="text-muted-foreground">
          No bays are scheduled for future availability.
        </p>
      );
    }

    // Create a map of claimed bay IDs for quick lookup
    const claimedBayIds = new Set(
      (claimsData?.activeClaims || []).map((item: any) => item.bay.id)
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableBays.data
          .filter(
            (item: any) =>
              item.availability?.isAvailable &&
              item.availability?.availableFrom &&
              item.availability?.availableFrom > now
          )
          .map((item: any) => (
            <Card key={item.bay.id} className="overflow-hidden border-blue-300">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg">Bay {item.bay.label}</CardTitle>
                <CardDescription>Owner: {item.ownerName}</CardDescription>
              </CardHeader>
              <CardContent className="bg-muted">
                <p>
                  <strong>Available from:</strong>{" "}
                  {item.availability?.availableFrom
                    ? format(item.availability.availableFrom, "p eeee, do MMM")
                    : "Error"}
                </p>
                <p>
                  <strong>Available until:</strong>{" "}
                  {item.availability?.availableUntil
                    ? format(item.availability.availableUntil, "p eeee, do MMM")
                    : "Error"}
                </p>
              </CardContent>
              <CardFooter className="border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onClaimBay(
                      item.bay.id,
                      item.availability?.availableUntil!,
                      true
                    )
                  }
                  disabled={claimedBayIds.has(item.bay.id)}
                >
                  {claimedBayIds.has(item.bay.id)
                    ? "Already Claimed"
                    : "Claim Future Bay"}
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-medium mb-4">Available Now</h3>
        {renderAvailableBays()}
      </div>

      <div>
        <h3 className="text-xl font-medium mb-2">Future Availability</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Bays that will become available in the future
        </p>
        {renderFutureAvailableBays()}
      </div>
    </div>
  );
}
