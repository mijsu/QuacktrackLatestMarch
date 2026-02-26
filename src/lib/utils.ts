import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Custom event for settings changes
export const SETTINGS_CHANGED_EVENT = 'settings-changed';

export function dispatchSettingsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SETTINGS_CHANGED_EVENT));
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSemester(semester: number): string {
  switch (semester) {
    case 1:
      return 'First Semester';
    case 2:
      return 'Second Semester';
    case 3:
      return 'Summer';
    default:
      return `Semester ${semester}`;
  }
}

export function formatYear(year: number): string {
  switch (year) {
    case 1:
      return 'First Year';
    case 2:
      return 'Second Year';
    case 3:
      return 'Third Year';
    case 4:
      return 'Fourth Year';
    default:
      return `Year ${year}`;
  }
}
