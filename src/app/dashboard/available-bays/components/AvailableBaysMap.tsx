"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface AvailableBaysMapProps {
  availableBays: any;
  claimsData: any;
  onClaimBay: (
    bayId: number,
    availableUntil: Date | null,
    isFutureAvailability?: boolean
  ) => Promise<void>;
  now: Date;
}

export default function AvailableBaysMap({
  availableBays,
  claimsData,
  onClaimBay,
  now,
}: AvailableBaysMapProps) {
  const [selectedBay, setSelectedBay] = useState<number | null>(null);

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
                  item.bay.id,
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

  if (!availableBays?.data || availableBays.data.length === 0) {
    return (
      <div className="text-center p-8">No bays available to display on map</div>
    );
  }

  // Create a map of claimed bay IDs for quick lookup
  const claimedBayIds = new Set(
    (claimsData?.activeClaims || []).map((item: any) => item.bay.id)
  );

  // Filter current and future availability bays
  const currentBays = availableBays.data.filter(
    (item: any) =>
      item.availability?.isAvailable &&
      item.availability?.availableUntil &&
      item.availability?.availableUntil > now &&
      item.availability?.availableFrom &&
      item.availability?.availableFrom < now
  );

  const futureBays = availableBays.data.filter(
    (item: any) =>
      item.availability?.isAvailable &&
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
}
