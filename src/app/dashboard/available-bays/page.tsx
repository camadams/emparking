"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { getAvailableBays } from "../bays/availability-actions";
import { getMyActiveClaims, releaseBay, claimBay } from "./actions";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";

export default function AvailableBaysPage() {
  // Ensure user is authenticated
  useAuthenticate();

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">Parking Availability</h1>
      <AvailableBaysSection />
    </div>
  );
}

// Component for listing available bays
function AvailableBaysSection() {
  const queryClient = useQueryClient();

  // Fetch available bays
  const { data, isLoading } = useQuery({
    queryKey: ["available-bays"],
    queryFn: getAvailableBays,
  });

  // Fetch user's active claims
  const { data: claimsData, isLoading: isLoadingClaims } = useQuery({
    queryKey: ["my-claims"],
    queryFn: getMyActiveClaims,
  });

  // Handle claiming a bay
  async function onClaimBay(bayId: number, availableUntil: Date | null) {
    // Confirm with the user about bay availability responsibilities
    const confirmed = window.confirm(
      `Please confirm that you understand this bay is only available until ${availableUntil?.toLocaleString()}. You must be responsible to move before that time and to unclaim the bay in this app when you're done using it.`
    );

    if (!confirmed) {
      return; // User canceled the action
    }

    const result = await claimBay(bayId);

    if (result.error) {
      toast.error(result.error);
    }
    if (result.message) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["available-bays"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
    }
  }

  // Handle releasing a bay
  async function onReleaseBay(claimId: number) {
    const result = await releaseBay(claimId);

    if (result.error) {
      toast.error(result.error);
    }
    if (result.message) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["available-bays"] });
      queryClient.invalidateQueries({ queryKey: ["my-claims"] });
    }
  }

  // Show loading state
  if (isLoading || isLoadingClaims) {
    return <div className="text-center p-8">Loading available bays...</div>;
  }

  // Show active claims
  const renderActiveClaims = () => {
    if (!claimsData?.activeClaims || claimsData.activeClaims.length === 0) {
      return (
        <p className="text-muted-foreground">You haven't claimed any bays.</p>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {claimsData.activeClaims.map((item) => (
          <Card key={item.claim.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Bay {item.bay.label}</CardTitle>
              <CardDescription>Owner: {item.ownerName}</CardDescription>
            </CardHeader>
            <CardContent className="bg-muted">
              <p>Claimed: {new Date(item.claim.claimedAt).toLocaleString()}</p>
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
        ))}
      </div>
    );
  };

  // Show available bays
  const renderAvailableBays = () => {
    if (!data?.availableBays || data.availableBays.length === 0) {
      return (
        <p className="text-muted-foreground">
          No bays are currently available.
        </p>
      );
    }

    // Create a map of claimed bay IDs for quick lookup
    const claimedBayIds = new Set(
      (claimsData?.activeClaims || []).map((item) => item.bay.id)
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.availableBays.map((item) => (
          <Card key={item.bay.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">Bay {item.bay.label}</CardTitle>
              <CardDescription>Owner: {item.ownerName}</CardDescription>
            </CardHeader>
            <CardContent className="bg-muted">
              <p>
                Available since:{" "}
                {item.availability.updatedAt
                  ? new Date(item.availability.updatedAt).toLocaleString()
                  : "Unknown"}
              </p>
              {item.availability.availableUntil && (
                <p>
                  Available until:{" "}
                  {item.availability.availableUntil
                    ? new Date(
                        item.availability.availableUntil
                      ).toLocaleString()
                    : "Unknown"}
                </p>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button
                variant="default"
                size="sm"
                onClick={() =>
                  onClaimBay(item.bay.id, item.availability.availableUntil)
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

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">My Active Claims</h2>
        {renderActiveClaims()}
      </div>

      <div className="space-y-4 mt-8">
        <h2 className="text-2xl font-bold">Available Bays</h2>
        {renderAvailableBays()}
      </div>
    </div>
  );
}
