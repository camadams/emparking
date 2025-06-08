"use client";
import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Moon, Sun } from "lucide-react";

export default function DarkModeButton() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  const toggleDarkMode = () => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
      setIsDark(!isDark);
    }
  };

  return (
    <Button
      className="p-1"
      variant="outline"
      size="icon"
      onClick={toggleDarkMode}
      asChild
    >
      {isDark ? <Moon /> : <Sun />}
    </Button>
  );
}
