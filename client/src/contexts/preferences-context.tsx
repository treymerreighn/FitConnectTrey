import React, { createContext, useContext, useState, useEffect } from 'react';

export type WeightUnit = 'lbs' | 'kg';

interface PreferencesContextType {
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  convertWeight: (weight: number, toUnit?: WeightUnit) => number;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

const STORAGE_KEY = 'fitconnect-preferences';

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.weightUnit || 'lbs';
      } catch {
        return 'lbs';
      }
    }
    return 'lbs'; // Default to pounds
  });

  useEffect(() => {
    const preferences = { weightUnit };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [weightUnit]);

  const setWeightUnit = (unit: WeightUnit) => {
    setWeightUnitState(unit);
  };

  // Convert weight between units
  // If toUnit is not provided, it returns the weight in the current unit
  const convertWeight = (weight: number, toUnit?: WeightUnit): number => {
    const targetUnit = toUnit || weightUnit;
    
    // If weight is in kg and we want lbs
    if (targetUnit === 'lbs' && weightUnit === 'kg') {
      return Math.round(weight * 2.20462 * 10) / 10;
    }
    
    // If weight is in lbs and we want kg
    if (targetUnit === 'kg' && weightUnit === 'lbs') {
      return Math.round(weight * 0.453592 * 10) / 10;
    }
    
    // Same unit, return as is
    return weight;
  };

  return (
    <PreferencesContext.Provider value={{ weightUnit, setWeightUnit, convertWeight }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
