import { Moon, Sun, Sparkles } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme, setProfessionalTheme, isProfessional } = useTheme();

  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full">
                {theme === "light" ? (
                  <Sun className="h-[1.2rem] w-[1.2rem] text-amber-600" />
                ) : theme === "professional" ? (
                  <Sparkles className="h-[1.2rem] w-[1.2rem] text-blue-400 animate-pulse-soft" />
                ) : (
                  <Moon className="h-[1.2rem] w-[1.2rem] text-gray-300" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>
          <TooltipContent>
            <p>Change theme</p>
          </TooltipContent>
        </Tooltip>
      <DropdownMenuContent align="end" className="glass-card-dark border-blue-900/20 w-44">
        <DropdownMenuItem 
          onClick={() => setProfessionalTheme()}
          className={theme === "professional" ? "bg-blue-900/30 text-blue-300" : "text-slate-300 hover:text-blue-300"}
        >
          <Sparkles className="h-4 w-4 mr-2 text-blue-400" />
          <span>Professional Dark</span>
          {theme === "professional" && <span className="ml-auto text-xs text-blue-400">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => toggleTheme()}
          className={theme === "dark" && !isProfessional ? "bg-gray-800 text-gray-300" : "text-slate-300"}
        >
          <Moon className="h-4 w-4 mr-2 text-gray-400" />
          <span>Dark Mode</span>
          {theme === "dark" && !isProfessional && <span className="ml-auto text-xs text-gray-400">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => toggleTheme()}
          className={theme === "light" ? "bg-amber-900/30 text-amber-300" : "text-slate-300"}
        >
          <Sun className="h-4 w-4 mr-2 text-amber-400" />
          <span>Light Mode</span>
          {theme === "light" && <span className="ml-auto text-xs text-amber-400">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
