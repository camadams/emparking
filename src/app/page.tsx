"use client";
import { authClient } from "@/lib/auth-client";
import {
  AuthLoading,
  SignedIn,
  UpdateUsernameCard,
  UserButton,
} from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (session?.user) {
    redirect("/dashboard");
  }
  return (
    <div>
      <h1>Landing Page</h1>
      <Link href="/auth/sign-up">Sign Up</Link>
      <Link href="/auth/sign-in">Sign In</Link>
    </div>
  );
}
