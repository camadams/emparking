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
import { Button } from "@/components/ui/button";
import { Car, ParkingCircle, Users, Clock } from "lucide-react";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold">
                Easy Parking for Your Community
              </h1>
              <p className="text-xl opacity-90">
                EmParking helps you share and find parking spots in your
                building.
              </p>
              <div className="flex gap-4 pt-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-white text-blue-700 hover:bg-gray-100"
                >
                  <Link href="/auth/sign-up">Create Account</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-white text-white bg-white/10"
                >
                  <Link href="/auth/sign-in">Sign In</Link>
                </Button>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="w-full max-w-md aspect-square bg-white/10 rounded-lg flex items-center justify-center p-8">
                <ParkingCircle size={180} className="opacity-90" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border flex flex-col items-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Car className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">Register Your Bay</h3>
              <p className="text-gray-600">
                Add your parking spot and share it when you don't need it.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border flex flex-col items-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <ParkingCircle className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">Find Parking</h3>
              <p className="text-gray-600">
                Quickly find and claim open parking spots when you need them.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-sm border flex flex-col items-center text-center">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold mb-2">Share With Neighbors</h3>
              <p className="text-gray-600">
                Help your neighbors by sharing your spot when you're away.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">Get Started Now</h2>
          <p className="text-xl text-gray-700 mb-8">
            Join EmParking today and say goodbye to parking problems.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-700" asChild>
              <Link href="/auth/sign-up">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0 flex items-center">
              <ParkingCircle className="mr-2" />
              <span className="font-bold text-xl">EmParking</span>
            </div>
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} EmParking. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
