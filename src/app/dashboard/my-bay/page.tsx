"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import { getMyBay, registerBay, updateBayLabel } from "./actions";
import { toggleBayAvailability } from "../bays/availability-actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthenticate } from "@daveyplate/better-auth-ui";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

// Form schema for bay registration/updating
const bayFormSchema = z.object({
  label: z.string().min(1, { message: "Bay label is required" }),
});

// Registration form schema with ownership confirmation
const registrationFormSchema = bayFormSchema.extend({
  confirmOwnership: z.boolean().refine((val) => val === true, {
    message: "You must confirm that this is your bay",
  }),
});

// Form values type
type BayFormValues = z.infer<typeof bayFormSchema>;
type RegistrationFormValues = z.infer<typeof registrationFormSchema>;

export default function MyBayPage() {
  // Ensure user is authenticated
  useAuthenticate();

  return (
    <div className="container max-w-5xl py-8 mx-auto">
      <h1 className="text-3xl font-bold mb-6">My Parking Bay</h1>
      <MyBaySection />
    </div>
  );
}

// Component for managing the current user's bay
function MyBaySection() {
  const queryClient = useQueryClient();

  // Fetch the current user's bay
  const { data: myBayData, isLoading: isLoadingBay } = useQuery({
    queryKey: ["my-bay"],
    queryFn: getMyBay,
  });

  // Form for registering a new bay
  const registerForm = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      label: "",
      confirmOwnership: false,
    },
  });

  // Form for updating bay label
  const updateForm = useForm<BayFormValues>({
    resolver: zodResolver(bayFormSchema),
    defaultValues: {
      label: myBayData?.bay?.label || "",
    },
  });

  // State for toggling edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  // Handle bay registration
  async function onRegisterBay(values: RegistrationFormValues) {
    // Show confirmation dialog
    const confirmResult = window.confirm(
      `Are you sure you want to register bay "${values.label}"?.`
    );

    if (!confirmResult) {
      return;
    }

    const result = await registerBay(values.label, values.confirmOwnership);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.message) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
    }
  }

  // Handle bay update
  async function onUpdateBay(values: BayFormValues) {
    if (!myBayData?.bay?.id) return;

    // Show confirmation dialog
    const confirmResult = window.confirm(
      `Are you sure you want to change your bay label to "${values.label}"?`
    );

    if (!confirmResult) {
      return;
    }

    const result = await updateBayLabel(myBayData.bay.id, values.label);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.message) {
      toast.success(result.message);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
    }
  }

  // Handle toggling bay availability
  async function toggleAvailability() {
    if (!myBayData?.bay?.id) return;
    setIsToggling(true);

    const currentAvailability = myBayData?.availability?.isAvailable || false;

    const result = await toggleBayAvailability(
      myBayData.bay.id,
      !currentAvailability
    );

    if (result.error) {
      toast.error(result.error);
    }

    if (result.message) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
      queryClient.invalidateQueries({ queryKey: ["available-bays"] });
    }

    setIsToggling(false);
  }

  // Start edit mode with current bay label
  function startEditing() {
    if (myBayData?.bay) {
      updateForm.reset({ label: myBayData.bay.label });
      setIsEditing(true);
    }
  }

  // Show registration form if no bay exists
  if (!myBayData?.bay && !isLoadingBay) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Register Your Bay</CardTitle>
          <CardDescription>
            Register your parking bay to make it available to others.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...registerForm}>
            <form
              onSubmit={registerForm.handleSubmit(onRegisterBay)}
              className="space-y-4"
            >
              <FormField
                control={registerForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bay Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A23" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your bay's unique label/number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={registerForm.control}
                name="confirmOwnership"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 mt-1"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        I confirm that this is my assigned bay
                      </FormLabel>
                      <FormDescription>
                        By checking this box, you confirm that you are the
                        rightful owner of this parking bay.
                      </FormDescription>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={registerForm.formState.isSubmitting}
              >
                {registerForm.formState.isSubmitting
                  ? "Registering..."
                  : "Register My Bay"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (isLoadingBay) {
    return <div className="text-center p-8">Loading your bay details...</div>;
  }

  // Show bay management UI once bay is registered
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Parking Bay</CardTitle>
        <CardDescription>
          Manage your bay details and availability
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <Form {...updateForm}>
            <form
              onSubmit={updateForm.handleSubmit(onUpdateBay)}
              className="space-y-4"
            >
              <FormField
                control={updateForm.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bay Label</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. A23" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your bay's updated label/number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={updateForm.formState.isSubmitting}
                >
                  {updateForm.formState.isSubmitting ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold text-lg">Bay {myBayData?.bay?.label}</h3>
              <p className="text-muted-foreground">
                Registered on{" "}
                {myBayData?.bay?.createdAt &&
                  new Date(myBayData?.bay?.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Button variant="outline" onClick={startEditing}>
              Edit
            </Button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div>
            <p className="font-medium">Availability Status</p>
            <p
              className={`font-bold ${
                myBayData?.availability?.isAvailable
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {myBayData?.availability?.isAvailable
                ? "Available"
                : "Unavailable"}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={myBayData?.availability?.isAvailable || false}
              onCheckedChange={toggleAvailability}
              disabled={isToggling}
            />
            <span className="text-sm">
              {myBayData?.availability?.isAvailable ? "On" : "Off"}
            </span>
          </div>
        </div>

        {/* Status messages based on availability and claim status */}
        {myBayData?.availability?.isAvailable && !myBayData?.activeClaim && (
          <p className="text-sm text-muted-foreground">
            Your bay is currently visible to other residents who may request to
            use it.
          </p>
        )}

        {/* Display claim status: either claimed or not claimed */}
        {myBayData?.bay && (
          <div
            className={`mt-4 p-4 border rounded-lg ${
              myBayData.activeClaim
                ? "border-primary/20 bg-primary/5"
                : "border-muted bg-muted/20"
            }`}
          >
            <h3
              className={`font-medium mb-2 ${
                myBayData.activeClaim ? "text-primary" : "text-foreground"
              }`}
            >
              {myBayData.activeClaim
                ? "Currently Claimed"
                : "Not Currently Claimed"}
            </h3>

            {!myBayData.activeClaim && (
              <div className="text-muted-foreground">
                <p>No one is currently using your parking bay.</p>
              </div>
            )}

            {myBayData.activeClaim && (
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-muted">
                  {myBayData.activeClaim.claimer.image ? (
                    <AvatarImage
                      src={myBayData.activeClaim.claimer.image}
                      alt={myBayData.activeClaim.claimer.name || "User"}
                    />
                  ) : null}
                  <AvatarFallback>
                    {(myBayData.activeClaim.claimer.name || "U").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {myBayData.activeClaim.claimer.name || "A resident"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {myBayData.activeClaim.claimer.email}
                  </p>
                  <p className="text-xs mt-1">
                    Claimed on{" "}
                    {new Date(myBayData.activeClaim.claimedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
