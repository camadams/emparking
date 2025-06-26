"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  getMyActiveClaims,
  releaseBay,
  claimBay,
  getAvailablilties,
} from "./actions";
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
import {
  format,
  differenceInHours,
  differenceInDays,
  intervalToDuration,
} from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const now = new Date();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [selectedBay, setSelectedBay] = useState<number | null>(null);

  // Fetch available bays
  const { data: availablilities, isLoading } = useQuery({
    queryKey: ["available-bays"],
    queryFn: getAvailablilties,
  });

  // Fetch user's active claims
  const { data: claimsData, isLoading: isLoadingClaims } = useQuery({
    queryKey: ["my-claims"],
    queryFn: getMyActiveClaims,
  });

  // Handle claiming an availability
  async function onClaimBay(
    availabilityId: number,
    availableUntil: Date | null,
    isFutureAvailability: boolean = false
  ) {
    // Confirm with the user about availability responsibilities
    const confirmed = window.confirm(
      `Please confirm that you understand this parking spot is only available until ${
        availableUntil ? format(availableUntil, "p eeee, do MMM") : "Error"
      }. You must be responsible to move before that time and to release the claim in this app when you're done using it.`
    );

    if (!confirmed) {
      return; // User canceled the action
    }

    const result = await claimBay(availabilityId);

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
        {claimsData.activeClaims.map((item) => {
          const { days, hours, minutes } = intervalToDuration({
            start: now,
            end: item.availability?.availableUntil || now,
          });
          const availableUntilFormatted = format(
            item.availability?.availableUntil || now,
            "p eeee, do MMM"
          );
          const timeLeft = `${days ? days + " days, " : ""}${
            hours ? hours + " hours, " : ""
          }${minutes ? minutes + " minutes" : ""}`;
          return (
            <Card
              key={item.claim.id}
              className="overflow-hidden border-destructive"
            >
              <CardHeader>
                <CardTitle className="text-lg">
                  Bay {item.bay.label}{" "}
                  <span className="text-sm text-muted-foreground">
                    ({item.bay.note})
                  </span>
                </CardTitle>
                <CardDescription>Owner: {item.ownerName}</CardDescription>
              </CardHeader>
              <CardContent className="bg-muted">
                <p>
                  {`Claimed: ${format(
                    new Date(item.claim.claimedAt),
                    "p eeee, do MMM"
                  )}`}
                </p>
              </CardContent>
              <CardFooter className="border-t gap-6">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onReleaseBay(item.claim.id)}
                >
                  Release Bay
                </Button>
                <div className="mt-2  text-destructive">
                  {`Please release by: ${availableUntilFormatted}, which is in ${timeLeft}`}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };

  // Show available bays
  const renderAvailableBays = () => {
    if (!availablilities?.data || availablilities.data.length === 0) {
      return (
        <p className="text-muted-foreground">
          No bays are currently available.
        </p>
      );
    }

    // Create a map of claimed availability IDs for quick lookup
    const claimedAvailabilityIds = new Set(
      (claimsData?.activeClaims || []).map((item) => item.availability.id)
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availablilities.data
          .filter(
            (item) =>
              item.bay?.isVisible &&
              item.availability?.availableUntil &&
              item.availability?.availableUntil > now &&
              item.availability?.availableFrom &&
              item.availability?.availableFrom < now
          )
          .map((item) => (
            <Card key={item.availability.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">
                  Bay {item.bay.label}{" "}
                  <span className="text-sm text-muted-foreground">
                    ({item.bay.note})
                  </span>
                </CardTitle>
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
                    onClaimBay(
                      item.availability?.id!,
                      item.availability?.availableUntil!
                    )
                  }
                  disabled={claimedAvailabilityIds.has(item.availability?.id!)}
                >
                  {claimedAvailabilityIds.has(item.availability?.id!)
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
    if (!availablilities?.data || availablilities.data.length === 0) {
      return (
        <p className="text-muted-foreground">
          No bays are scheduled for future availability.
        </p>
      );
    }

    // Create a map of claimed bay IDs for quick lookup
    const claimedAvailabilityIds = new Set(
      (claimsData?.activeClaims || []).map((item) => item.availability.id)
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availablilities.data
          .filter(
            (item) =>
              item.bay?.isVisible &&
              item.availability?.availableFrom &&
              item.availability?.availableFrom > now
          )
          .map((item) => (
            <Card
              key={item.availability?.id}
              className="overflow-hidden border-blue-300"
            >
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-lg">
                  Bay {item.bay.label}{" "}
                  <span className="text-sm text-muted-foreground">
                    ({item.bay.note})
                  </span>
                </CardTitle>
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
                      item.availability?.id!,
                      item.availability?.availableUntil!,
                      true
                    )
                  }
                  disabled={claimedAvailabilityIds.has(item.availability?.id!)}
                >
                  {claimedAvailabilityIds.has(item.availability?.id!)
                    ? "Already Claimed"
                    : "Claim Future Bay"}
                </Button>
              </CardFooter>
            </Card>
          ))}
      </div>
    );
  };

  // Render bay on map
  const renderMapBay = (
    item: any,
    isClaimed: boolean,
    isFutureAvailability = false
  ) => {
    // Randomly position bays in the map for demo purposes
    const left = `${Math.floor(Math.random() * 80) + 5}%`;
    const top = `${Math.floor(Math.random() * 70) + 15}%`;
    const isSelected = selectedBay === item.bay.id;

    const baseClass =
      "absolute w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all";
    let statusClass = isClaimed
      ? "bg-gray-300 border-gray-400"
      : isFutureAvailability
      ? "bg-blue-100 border-blue-300 hover:bg-blue-200"
      : "bg-green-100 border-green-300 hover:bg-green-200";

    if (isSelected) {
      statusClass =
        "bg-primary border-primary text-white ring-4 ring-primary/30";
    }

    return (
      <div
        key={`map-${item.bay.id}`}
        className={`${baseClass} ${statusClass} border-2`}
        style={{ left, top }}
        onClick={() => setSelectedBay(isSelected ? null : item.bay.id)}
        title={`Bay ${item.bay.label}`}
      >
        {item.bay.label}
        {isSelected && (
          <div className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-md shadow-lg border w-48 text-center z-10">
            <p className="font-bold">Bay {item.bay.label}</p>
            <p className="text-xs">
              {isFutureAvailability ? "Available in future" : "Available now"}
            </p>
            <Button
              size="sm"
              className="mt-2 w-full"
              variant={isFutureAvailability ? "outline" : "default"}
              disabled={isClaimed}
              onClick={(e) => {
                e.stopPropagation();
                onClaimBay(
                  item.availability?.id!,
                  item.availability?.availableUntil!,
                  isFutureAvailability
                );
                setSelectedBay(null);
              }}
            >
              {isClaimed ? "Already Claimed" : "Claim Bay"}
            </Button>
          </div>
        )}
      </div>
    );
  };

  // Render map view of bays
  const renderMapView = () => {
    if (!availablilities?.data || availablilities.data.length === 0) {
      return (
        <div className="text-center p-8">
          No bays available to display on map
        </div>
      );
    }

    // Create a map of claimed bay IDs for quick lookup
    const claimedBayIds = new Set(
      (claimsData?.activeClaims || []).map((item) => item.bay.id)
    );

    // Filter current and future availability bays
    const currentBays = availablilities.data.filter(
      (item) =>
        item.bay?.isVisible &&
        item.availability?.availableUntil &&
        item.availability?.availableUntil > now &&
        item.availability?.availableFrom &&
        item.availability?.availableFrom < now
    );

    const futureBays = availablilities.data.filter(
      (item) =>
        item.bay?.isVisible &&
        item.availability?.availableFrom &&
        item.availability?.availableFrom > now
    );

    return (
      <div className="bg-gray-100 border rounded-lg h-[500px] relative overflow-hidden">
        <div className="absolute top-4 left-4 bg-white p-2 rounded shadow-md z-10 text-xs">
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 rounded-full bg-green-100 border border-green-300 mr-2"></div>
            <span>Available Now</span>
          </div>
          <div className="flex items-center mb-2">
            <div className="w-4 h-4 rounded-full bg-blue-100 border border-blue-300 mr-2"></div>
            <span>Future Availability</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400 mr-2"></div>
            <span>Claimed</span>
          </div>
        </div>

        {/* {currentBays.map(item => renderMapBay(item, claimedBayIds.has(item.bay.id)))}
        {futureBays.map(item => renderMapBay(item, claimedBayIds.has(item.bay.id), true))} */}

        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          Parking Map View (Demo)
        </div>
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
        <h2 className="text-2xl font-bold">Available Parking</h2>

        <Tabs
          defaultValue="list"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="map">Map View</TabsTrigger>
          </TabsList>
          <TabsContent value="list" className="space-y-8">
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
          </TabsContent>
          <TabsContent value="map">{renderMapView()}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
