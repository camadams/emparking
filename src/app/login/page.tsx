"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export default function Login() {
  return (
    <div>
      <Button onClick={() => authClient.signIn.social({ provider: "google" })}>
        Sign in with Google
      </Button>
    </div>
  );
}
