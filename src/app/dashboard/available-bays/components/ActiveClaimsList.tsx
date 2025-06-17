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

interface ActiveClaimsListProps {
  claimsData: any;
  onReleaseBay: (claimId: number) => Promise<void>;
  now: Date;
}

export default function ActiveClaimsList({
  claimsData,
  onReleaseBay,
  now,
}: ActiveClaimsListProps) {
  if (!claimsData?.activeClaims || claimsData.activeClaims.length === 0) {
    return (
      <p className="text-muted-foreground">You haven't claimed any bays.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {claimsData.activeClaims.map((item: any) => {
        const { days, hours, minutes } = intervalToDuration({
          start: now,
          end: item.availability?.availableUntil || now,
        });
        const availableUntilFormatted = format(
          item.availability?.availableUntil || now,
          "p eeee, do MMM"
        );
        const timeLeft = `${days} days, ${hours} hours and ${minutes} minutes`;
        return (
          <Card
            key={item.claim.id}
            className="overflow-hidden border-destructive"
          >
            <CardHeader>
              <CardTitle className="text-lg">Bay {item.bay.label}</CardTitle>
              <CardDescription>Owner: {item.ownerName}</CardDescription>
            </CardHeader>
            <CardContent className="bg-muted">
              <p>
                {`Claimed: ${format(
                  new Date(item.claim.claimedAt),
                  "p eeee, do MMM"
                )}`}
              </p>
              <p className="font-semibold">
                Available until: {availableUntilFormatted}
              </p>
              <p className="text-sm mt-2">Time remaining: {timeLeft}</p>
            </CardContent>
            <CardFooter className="border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onReleaseBay(item.claim.id)}
              >
                Release Bay
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
