"use client";
import { authClient } from "@/lib/auth-client";
import {
  AuthLoading,
  SignedIn,
  UpdateUsernameCard,
  UserButton,
} from "@daveyplate/better-auth-ui";
import { redirect } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <AuthLoading>Hi</AuthLoading>;
  }

  if (!session?.user) {
    redirect("/login");
  }
  return (
    <SignedIn>
      <div className="max-w-2xl mx-auto p-10">
        <UserButton />
        {/* <h1>{JSON.stringify(session?.user)}</h1> */}

        <UpdateUsernameCard
          classNames={{
            base: "border-blue-500",
            header: "bg-blue-50",
            title: "text-blue-500",
            description: "text-muted-foreground",
            content: "bg-blue-50",
            footer: "bg-blue-50",
            input: "bg-background border-blue-500 placeholder:text-muted",
          }}
        />
      </div>
    </SignedIn>
  );
}
