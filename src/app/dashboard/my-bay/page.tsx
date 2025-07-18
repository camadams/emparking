"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState, useEffect } from "react";
import {
  getMyBay,
  registerBay,
  updateAvailabilityAction,
  toggleBayVisibility,
  updateBayLabel,
  updateBayNote,
  createAvailabilityAction,
} from "./actions";
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
import { DateTimePicker } from "@/components/date-time-picker";
import { format } from "date-fns";

// Form schema for bay registration/updating
const bayFormSchema = z.object({
  label: z.string().min(1, { message: "Bay label is required" }),
  note: z.string().optional(),
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

function MyBaySection() {
  const { data: myBayData, isLoading: isLoadingBay } = useQuery({
    queryKey: ["my-bay"],
    queryFn: getMyBay,
  });
  // State for toggling edit mode and visibility settings
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  // const [isAvailable, setIsAvailable] = useState(false);

  // State for date/time pickers
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [fromTime, setFromTime] = useState("00:00");
  const [untilDate, setUntilDate] = useState<Date | undefined>(undefined);
  const [untilTime, setUntilTime] = useState("23:59");

  const [selectedAvailabilityId, setSelectedAvailabilityId] =
    useState<number>(0);

  const [isAddingAvailability, setIsAddingAvailability] = useState(false);
  // // Load current availability data
  // useEffect(() => {
  //   if (myBayData?.availability) {
  //     setIsAvailable(myBayData.availability.isAvailable);
  //     if (myBayData.availability.availableFrom) {
  //       const fromDateTime = new Date(myBayData.availability.availableFrom);
  //       setFromDate(fromDateTime);
  //       setFromTime(fromDateTime.toTimeString().substring(0, 5));
  //     }

  //     if (myBayData.availability.availableUntil) {
  //       const untilDateTime = new Date(myBayData.availability.availableUntil);
  //       setUntilDate(untilDateTime);
  //       setUntilTime(untilDateTime.toTimeString().substring(0, 5));
  //     }
  //   }
  // }, [myBayData?.availability]);

  const queryClient = useQueryClient();

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
      note: myBayData?.bay?.note || "",
    },
  });

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

  // Handle bay note update
  async function onUpdateNote(values: BayFormValues) {
    if (!myBayData?.bay?.id) return;

    const note = values.note || "";
    const result = await updateBayNote(myBayData.bay.id, note);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.message) {
      toast.success(result.message);
      setIsEditingNote(false);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
    }
  }

  // Combine date and time into a single Date object
  function combineDateTime(
    date: Date | undefined,
    timeStr: string
  ): Date | undefined {
    if (!date) return undefined;

    const [hours, minutes] = timeStr.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined;
  }

  async function toggleVisibility() {
    if (!myBayData?.bay?.id) {
      toast.error("Bay ID not found");
      return;
    }
    setIsToggling(true);

    const result = await toggleBayVisibility(
      myBayData.bay.id,
      !myBayData.bay.isVisible
    );

    if (result.error) {
      toast.error(result.error);
      setIsToggling(false);
      return;
    }

    if (result.message) {
      toast.success(result.message);
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
      setIsToggling(false);
    }
  }

  // Handle updating Availability dates while maintaining bay visibility
  async function updateAvailability(availabilityId: number) {
    if (!myBayData?.bay?.id) {
      toast.error("Bay ID not found");
      return;
    }
    setIsToggling(true);

    // Prepare date objects by combining date and time values
    const availableFrom = combineDateTime(fromDate, fromTime);
    const availableUntil = combineDateTime(untilDate, untilTime);

    if (!availableFrom || !availableUntil) {
      toast.error("Please select a date range");
      setIsToggling(false);
      return;
    }

    if (availableFrom >= availableUntil) {
      toast.error(
        "Available From date must be earlier than Available Until date"
      );
      setIsToggling(false);
      return;
    }

    const result = await updateAvailabilityAction(
      availabilityId,
      availableFrom,
      availableUntil
    );

    if (result.error) {
      toast.error(result.error);
      setIsToggling(false);
      return;
    }

    if (result.message) {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
      setIsToggling(false);
    }
  }

  // Start edit mode with current bay label
  function startEditing() {
    if (myBayData?.bay) {
      updateForm.setValue("label", myBayData.bay.label);
      setIsEditing(true);
    }
  }

  // Start edit mode for note with current bay note
  function startEditingNote() {
    if (myBayData?.bay) {
      updateForm.setValue("note", myBayData.bay.note || "");
      setIsEditingNote(true);
    }
  }

  // Check if current time is within availability window
  function isWithinAvailabilityWindow(
    availableFrom: Date | null,
    availableUntil: Date | null
  ): boolean {
    const now = new Date();

    // If no date ranges set, consider as available
    if (!availableFrom && !availableUntil) return false;

    // Check if current time is after start time (or no start time set)
    const afterStart = !availableFrom || availableFrom <= now;

    // Check if current time is before end time (or no end time set)
    const beforeEnd = !availableUntil || availableUntil >= now;

    return afterStart && beforeEnd;
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
  if (isLoadingBay || !myBayData) {
    return <div className="text-center p-8">Loading your bay details...</div>;
  }

  const toggleAddingAvailability = () => {
    const now = new Date();
    setFromDate(now);
    setFromTime("00:00");
    setUntilDate(now);
    setUntilTime("23:59");
    setIsAddingAvailability(!isAddingAvailability);
  };

  const handleCreateAvailability = async () => {
    if (!myBayData?.bay?.id) {
      toast.error("Bay ID not found");
      setIsAddingAvailability(false);
      return;
    }
    // Prepare date objects by combining date and time values
    const availableFrom = combineDateTime(fromDate, fromTime);
    const availableUntil = combineDateTime(untilDate, untilTime);

    if (!availableFrom || !availableUntil) {
      toast.error("Please select a date range");
      setIsAddingAvailability(false);
      return;
    }

    if (availableFrom >= availableUntil) {
      toast.error(
        "Available From date must be earlier than Available Until date"
      );
      setIsAddingAvailability(false);
      return;
    }
    const result = await createAvailabilityAction(
      myBayData.bay.id,
      availableFrom,
      availableUntil
    );

    if (result.error) {
      toast.error(result.error);
      setIsAddingAvailability(false);
      return;
    }

    if (result.message) {
      toast.success(result.message);
      setIsAddingAvailability(false);
      queryClient.invalidateQueries({ queryKey: ["my-bay"] });
    }
  };

  // const onAvailabilityChanged = (
  //   setFromDate: (date: Date) => void
  // ): ((date: Date) => void) => {
  //   return (date: Date) => {
  //     setFromDate(date);
  //   };
  // };
  // Show bay management UI once bay is registered

  const atLeastOneAvailabilityClaimable = myBayData?.availability?.some(
    (availability) =>
      availability.availableUntil && availability.availableUntil > new Date()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Parking Bay</CardTitle>
        <CardDescription>
          Manage your bay details and visibility
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

        {/* Bay Note Section */}
        <div className="pt-4 border-t border-dashed mb-4">
          <h3 className="text-sm font-medium mb-2">Bay Note:</h3>
          {isEditingNote ? (
            <Form {...updateForm}>
              <form
                onSubmit={updateForm.handleSubmit(onUpdateNote)}
                className="space-y-4"
              >
                <FormField
                  control={updateForm.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          placeholder="Add a note about your bay"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Add any details or information about your bay.
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
                    {updateForm.formState.isSubmitting
                      ? "Saving..."
                      : "Save Note"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditingNote(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">
                  {myBayData?.bay?.note ? myBayData.bay.note : "No note added"}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={startEditingNote}>
                {myBayData?.bay?.note ? "Edit Note" : "Add Note"}
              </Button>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Visibility Status</p>
              <p
                className={`font-bold ${
                  myBayData?.bay?.isVisible
                    ? atLeastOneAvailabilityClaimable
                      ? "text-green-500"
                      : "text-yellow-500"
                    : "text-red-500"
                }`}
              >
                {myBayData?.bay?.isVisible
                  ? atLeastOneAvailabilityClaimable
                    ? "Visible"
                    : "Hidden (no claimable availabilities, please add some)"
                  : "Hidden"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={myBayData?.bay?.isVisible}
                onCheckedChange={(checked) => toggleVisibility()}
                disabled={isToggling}
              />
              <span className="text-sm">
                {myBayData?.bay?.isVisible ? "On" : "Off"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {myBayData?.availability?.map((availability) => {
            const availableFromData = availability.availableFrom;
            console.log({ availableFromData });
            const fromTimeData = availableFromData
              ? availableFromData.toTimeString().substring(0, 5)
              : "00:00";

            const availableUntilData = availability.availableUntil;
            const untilTimeData = availableUntilData
              ? availableUntilData.toTimeString().substring(0, 5)
              : "23:59";
            return (
              <div
                key={availability.id}
                className="mt-4 space-x-4 flex md:flex-row flex-col gap-2 "
                onClick={() => {
                  if (selectedAvailabilityId === availability.id) {
                    return;
                  }
                  setSelectedAvailabilityId(availability.id);
                  setFromDate(availability.availableFrom!);
                  setFromTime(fromTimeData);
                  setUntilDate(availability.availableUntil!);
                  setUntilTime(untilTimeData);
                }}
              >
                <DateTimePicker
                  label="Available From"
                  date={
                    selectedAvailabilityId === availability.id
                      ? fromDate
                      : availability.availableFrom!
                  }
                  onDateChange={setFromDate}
                  time={
                    selectedAvailabilityId === availability.id
                      ? fromTime
                      : fromTimeData
                  }
                  onTimeChange={setFromTime}
                  disabled={isToggling}
                />
                <DateTimePicker
                  label="Available Until"
                  date={
                    selectedAvailabilityId === availability.id
                      ? untilDate
                      : availability.availableUntil!
                  }
                  onDateChange={setUntilDate}
                  time={
                    selectedAvailabilityId === availability.id
                      ? untilTime
                      : untilTimeData
                  }
                  onTimeChange={setUntilTime}
                  disabled={isToggling}
                />
                <div className="flex justify-end flex-col">
                  <Button
                    onClick={() => updateAvailability(availability.id)}
                    disabled={isToggling}
                    className=""
                  >
                    {isToggling ? "Updating..." : "Save Availability"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        <div>
          {isAddingAvailability && (
            <div className="mt-4 space-x-4 flex md:flex-row flex-col gap-2 ">
              <DateTimePicker
                label="Available From"
                date={fromDate}
                onDateChange={setFromDate}
                time={fromTime}
                onTimeChange={setFromTime}
                disabled={isToggling}
              />
              <DateTimePicker
                label="Available Until"
                date={untilDate}
                onDateChange={setUntilDate}
                time={untilTime}
                onTimeChange={setUntilTime}
                disabled={isToggling}
              />
              <div className="flex justify-end flex-col">
                <Button
                  onClick={handleCreateAvailability}
                  disabled={isToggling}
                  className=""
                >
                  {isToggling ? "Updating..." : "Save Availability"}
                </Button>
              </div>
            </div>
          )}
        </div>
        <div className="mt-10 w-full flex justify-center">
          <Button
            variant="secondary"
            className="w-full"
            onClick={toggleAddingAvailability}
            disabled={isAddingAvailability}
          >
            Add Availability
          </Button>
        </div>

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
                    {`Claimed on ${format(
                      new Date(myBayData.activeClaim.claimedAt),
                      "p eeee, do MMM"
                    )}`}
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
