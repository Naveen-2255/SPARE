import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const lightTheme = {
  background: '#F4F6F8',
  text: '#1B3A57',
  card: '#FFFFFF',
  primary: '#1B3A57',
  headerText: '#FFFFFF',
  navigationText: '#1B3A57',
  error: '#DC2F02',
  white: '#FFFFFF'
};

const darkTheme = {
  background: '#121212',
  text: '#FFFFFF',
  card: '#1E1E1E',
  primary: '#1A1A1A',
  headerText: '#FFFFFF',
  navigationText: '#FFFFFF',
  error: '#DC2F02',
  white: '#FFFFFF'
};

export const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => { },
  theme: lightTheme,
});

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('isDarkMode');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'true');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('isDarkMode', newTheme.toString());
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { isDarkMode: false, toggleTheme: () => { }, theme: lightTheme };
  }
  return context;
};