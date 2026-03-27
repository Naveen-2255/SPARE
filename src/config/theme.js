/**
 * Professional Automotive Theme Configuration
 * Standardized color palette for the entire app
 */

export const AUTOMOTIVE_THEME = {
  // Primary Colors
  primary: '#343E3D',        // Muted Blue
  secondary: '#7B435B',      // Muted Purple
  accent: '#8d99ae',         // Light Pink

  // Background & Text
  background: '#edf2f4',     // Light Greenish Yellow
  text: '#040F0F',           // Dark/Black

  // Additional semantic colors
  success: '#06D6A0',        // Green for success states
  warning: '#E39774',        // Red for warnings (same as secondary)
  error: '#a62201e0',          // Dark Red for errors
  info: '#00A3E0',           // Info color (same as accent)

  // Light variants for backgrounds
  primaryLight: '#A3B8CC',   // Light variant of primary
  accentLight: '#F5DEEA',    // Light variant of accent

  // Neutral colors
  white: '#FFFFFF',
  black: '#040F0F',
  gray: '#6C757D',
  lightGray: '#E9ECEF',
  darkGray: '#343A40',

  // Shadows & Borders
  shadowColor: '#040F0F',
  borderColor: '#587792',
};

/**
 * Get theme object with dark/light mode support
 * @param {boolean} isDarkMode - Whether dark mode is enabled
 * @returns {Object} Theme object with mode-specific colors
 */
export const getTheme = (isDarkMode = false) => {
  if (isDarkMode) {
    return {
      background: '#040F0F',
      text: '#EFF7CF',
      card: '#587792',
      tabBar: '#040F0F',
      primary: AUTOMOTIVE_THEME.primary,
      secondary: AUTOMOTIVE_THEME.secondary,
      accent: AUTOMOTIVE_THEME.accent,
      statusBarStyle: 'light-content',
      navigationBackground: AUTOMOTIVE_THEME.primary,
      navigationText: '#EFF7CF',
    };
  }

  return {
    background: AUTOMOTIVE_THEME.background,
    text: AUTOMOTIVE_THEME.text,
    card: AUTOMOTIVE_THEME.primary,
    tabBar: AUTOMOTIVE_THEME.white,
    primary: AUTOMOTIVE_THEME.primary,
    secondary: AUTOMOTIVE_THEME.secondary,
    accent: AUTOMOTIVE_THEME.accent,
    statusBarStyle: 'dark-content',
    navigationBackground: AUTOMOTIVE_THEME.primary,
    navigationText: AUTOMOTIVE_THEME.background,
  };
};

export default AUTOMOTIVE_THEME;
