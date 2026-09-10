"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("zb-theme") as "light" | "dark" | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
      document.documentElement.setAttribute("data-theme", stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("dark");
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("zb-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  if (!mounted) {
    return (
      <button
        type="button"
        className="zb-theme-toggle"
        aria-label="Toggle theme"
        disabled
      >
        <span className="size-4 opacity-0" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="zb-theme-toggle"
      aria-label={`Switch to ${theme === "light" ? "Midnight Crimson" : "Bright Light"} theme`}
      title={`Theme: ${theme === "light" ? "Light" : "Midnight Crimson"}`}
    >
      {theme === "light" ? (
        <Moon className="zb-theme-toggle-icon" aria-hidden="true" />
      ) : (
        <Sun className="zb-theme-toggle-icon" aria-hidden="true" />
      )}
      <span className="zb-theme-toggle-label">
        {theme === "light" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
