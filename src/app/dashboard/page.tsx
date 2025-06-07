"use client";
import { authClient } from "@/lib/auth-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { addDummyData, getDummyData } from "./actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["dummies"],
    queryFn: () => getDummyData(),
  });

  const queryClient = useQueryClient();

  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: FormSchema) {
    const result = await addDummyData(values.name);

    if (result.error) {
      toast.error(result.error);
    }

    if (result.message) {
      toast.success(result.message);

      form.reset();
      queryClient.invalidateQueries({ queryKey: ["dummies"] });
    }
  }

  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Adding..." : "Add"}
          </Button>
        </form>
      </Form>

      <h2>Current Items</h2>
      {data && data.length > 0 ? (
        <div>
          {data.map((item) => (
            <div key={item.id}>
              <p>{item.name}</p>
              <p>Added: {new Date(item.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No items yet. Add your first one above!</p>
      )}
    </div>
  );
}
