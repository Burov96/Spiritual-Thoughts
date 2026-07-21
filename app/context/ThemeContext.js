'use client'

import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false); 

  useEffect(() => {
    setMounted(true);
    const loadTheme = () => {
      try {
        
        const saved = localStorage.getItem('@isDarkMode');
        if (saved !== null) {
          setIsDarkMode(JSON.parse(saved));
        } else {
          
          const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
          setIsDarkMode(systemPrefersDark);
        }
      } catch (e) {
        console.warn('Theme loading error:', e);
      }
    };
    
    loadTheme();
  }, []);

  const toggleDarkMode = (value) => {
    setIsDarkMode(value);
    try {
      
      localStorage.setItem('@isDarkMode', JSON.stringify(value));
    } catch (e) {
      console.warn('Theme saving error:', e);
    }
  };

  const colors = isDarkMode
    ? {
        background: '#1A1A1A',
        surface: '#2A2A2A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        border: '#404040',
        primary: '#0A84FF',
        success: '#34C759',
        successLight: '#1B5E20',
        warning: '#FF9500',
        warningLight: '#E65100',
        error: '#FF3B30',
      }
    : {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        border: '#E0E0E0',
        primary: '#007AFF',
        success: '#4CAF50',
        successLight: '#E8F5E9',
        warning: '#FF9800',
        warningLight: '#FFF3E0',
        error: '#F44336',
      };

  
  if (!mounted) {
    return null; 
  }

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};