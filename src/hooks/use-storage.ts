import { useEffect, useState } from "react";
import { getActivity, getOutputs, getTheme, setTheme as persistTheme, type Activity, type SavedOutput } from "@/lib/storage";

function useLocalKey<T>(read: () => T): T {
  const [val, setVal] = useState<T>(read);
  useEffect(() => {
    setVal(read());
    const onChange = () => setVal(read());
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
  }, [read]);
  return val;
}

export function useOutputs(): SavedOutput[] {
  return useLocalKey(getOutputs);
}

export function useActivity(): Activity[] {
  return useLocalKey(getActivity);
}

export function useTheme() {
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  useEffect(() => {
    const t = getTheme();
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);
  const setTheme = (t: "light" | "dark") => {
    setThemeState(t);
    persistTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };
  return { theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") };
}
