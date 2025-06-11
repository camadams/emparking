"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  label?: string;
  date: Date | undefined;
  onDateChange: (newDate: Date | undefined) => void;
  time: string;
  onTimeChange: (newTime: string) => void;
  disabled?: boolean;
}

export function DateTimePicker({
  label,
  date,
  onDateChange,
  time,
  onTimeChange,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Handle time input change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTimeChange(e.target.value);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <div className="flex gap-2 w-full">
        <Popover
          open={open && !disabled}
          onOpenChange={disabled ? undefined : setOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-1/2 justify-between font-normal"
              disabled={disabled}
            >
              {date ? date.toLocaleDateString() : "Select date"}
              <ChevronDownIcon className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                onDateChange(date);
                setOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <Input
          type="time"
          value={time}
          onChange={handleTimeChange}
          className="w-1/2"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
