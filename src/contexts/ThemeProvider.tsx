import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

import { useTheme as useNextTheme } from "next-themes";

export const useTheme = () => {
  const context = useNextTheme();
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
