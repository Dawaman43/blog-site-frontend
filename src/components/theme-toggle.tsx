import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/useTheme";
import { useEffect } from "react";
import { Button } from "./ui/button";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggleTheme = () => {
    toggleTheme();
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleTheme}
      aria-label="Toggle Theme"
    >
      <Sun className="w-5 h-5 rotate-0 scale-100 dark:rotate-90 dark:scale-0 transition-all" />
      <Moon className="absolute w-5 h-5 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
    </Button>
  );
}
