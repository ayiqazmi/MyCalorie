// useThemedStyles.js
import { useTheme } from "../ThemeContext";

export const useThemedStyles = (lightStyles, darkStyles) => {
  const { theme } = useTheme();
  return theme === "dark" ? darkStyles : lightStyles;
};
