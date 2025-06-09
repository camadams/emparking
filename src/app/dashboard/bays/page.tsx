"use client";
import { redirect } from "next/navigation";
import { useAuthenticate } from "@daveyplate/better-auth-ui";

/**
 * This page has been refactored into dedicated pages:
 * - My Bay functionality: /dashboard/my-bay
 * - Available Bays functionality: /dashboard/available-bays
 * 
 * This component now redirects to the My Bay page.
 */
export default function BaysPage() {
  // Ensure user is authenticated before redirect
  useAuthenticate();
  
  // Redirect to the My Bay page
  redirect("/dashboard/my-bay");
  
  // This won't render, but is here for completeness
  return null;
}
