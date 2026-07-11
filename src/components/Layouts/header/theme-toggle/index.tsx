import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme/theme-context";
import { useEffect, useState } from "react";
import { Moon, Sun } from "./icons";
import { useLanguage } from "@/lib/i18n/language-context";

const THEMES = [
  {
    name: "light",
    Icon: Sun,
  },
  {
    name: "dark",
    Icon: Moon,
  },
];

export function ThemeToggleSwitch() {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { dir } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";
  const translateClass = dir === "rtl"
    ? (isDark ? "translate-x-0" : "translate-x-12")
    : (isDark ? "translate-x-12" : "translate-x-0");

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="group cursor-pointer rounded-full bg-gray-3 p-1.25 text-dark outline-0 hover:outline-primary focus:outline-primary focus-visible:outline dark:bg-[#020D1A] dark:text-current"
    >
      <span className="sr-only">
        Switch to {theme === "light" ? "dark" : "light"} mode
      </span>

      <span aria-hidden className="relative flex gap-2.5">
        {/* Indicator */}
        <span
          className={cn(
            "absolute left-0 size-9.5 rounded-full border border-gray-200 bg-white transition-all dark:border-none dark:bg-dark-2 dark:group-hover:bg-dark-3",
            translateClass
          )}
        />

        {THEMES.map(({ name, Icon }) => (
          <span
            key={name}
            className={cn(
              "relative grid size-9.5 place-items-center rounded-full",
              name === "dark" && "dark:text-white",
            )}
          >
            <Icon />
          </span>
        ))}
      </span>
    </button>
  );
}
