"use client";
import React from "react";
import { useAuthenticate } from "@daveyplate/better-auth-ui";

export default function Dashboard() {
  useAuthenticate();
  return <div>Dashboard</div>;
}
