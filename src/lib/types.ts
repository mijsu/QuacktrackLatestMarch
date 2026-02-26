// User Types
export type UserRole = 'admin' | 'professor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  professorId?: string;
  avatar?: string;
  departmentIds?: string[];
  createdAt: Date;
}

// Subject Types
export interface Subject {
  id: string;
  code: string;
  name: string;
  year: number;
  semester: number;
  units: number;
  lectureHours: number;
  labHours: number;
  totalHours: number;
  programId?: string;
  programName?: string;
  createdAt: Date;
}

// Program Types
export interface Program {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId?: string;
  departmentName?: string;
  createdAt: Date;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
}

export interface Section {
  id: string;
  programId: string;
  programName: string;
  sectionName: string;
  year: number;
  createdAt: Date;
}

// Professor Types
export interface Professor {
  id: string;
  userId: string;
  name: string;
  email: string;
  specialization?: string;
  avatar?: string;
  createdAt: Date;
}

// Schedule Types
export interface ScheduleItem {
  id: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  type: 'lecture' | 'lab' | 'combined';
  sectionId: string;
  sectionName: string;
  programId: string;
  programName: string;
  year: number;
  professorId: string;
  professorName: string;
  day: string;
  startSlot: number;
  duration: number;
  semester: number;
  academicYear: string;
  lectureHours?: number;
  labHours?: number;
  createdAt: Date;
  stackIndex?: number; // For visual stacking of overlapping items
  totalStack?: number; // Total number of items in this stack
}

// System Settings
export interface SystemSettings {
  id: string;
  systemName: string;
  academicYear: string;
  currentSemester: number;
  updatedAt: Date;
}

// Constants - 6 days per week (Mon-Sat)
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

// Time slots: 7:00 AM to 9:00 PM (14 hours of class time)
// Each slot represents 1 hour starting at that time
// Slot 1 = 7:00 AM (hour from 7:00-8:00)
// Slot 14 = 8:00 PM (hour from 8:00-9:00) - LAST USABLE HOUR for classes
// Slot 15 = 9:00 PM (used for END TIME display only, not for class starts)
export const TIME_MAP: Record<number, string> = {
  1: "7:00 AM",
  2: "8:00 AM",
  3: "9:00 AM",
  4: "10:00 AM",
  5: "11:00 AM",
  6: "12:00 PM",
  7: "1:00 PM",
  8: "2:00 PM",
  9: "3:00 PM",
  10: "4:00 PM",
  11: "5:00 PM",
  12: "6:00 PM",
  13: "7:00 PM",
  14: "8:00 PM",
  15: "9:00 PM"  // Used for END TIME display only
};

export const SLOT_HEIGHT = 35;
export const HEADER_HEIGHT = 40;

// Maximum start slot for classes
// School hours: 7:00 AM to 9:00 PM (14 hours, slots 1-14)
// Classes must END by 9 PM (slot 15)
// For a class of duration D hours starting at slot N: N + D <= 15
// So N <= 15 - D
// This is calculated dynamically in the schedule algorithm based on subject duration
export const MAX_START_SLOT = 12; // Default for 3-hour classes (12 + 3 = 15)

// Filter Types
export type ScheduleFilter = 'master' | 'section' | 'professor' | 'year';

export interface FilterOptions {
  type: ScheduleFilter;
  sectionId?: string;
  professorId?: string;
  year?: number;
}
