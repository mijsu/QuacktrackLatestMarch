import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, query, where } from 'firebase/firestore';
import { ScheduleItem, MAX_START_SLOT, DAYS } from '@/lib/types';

// ============================================================================
// CONSTANTS - Scheduling constraints based on system requirements
// ============================================================================
// Each schedule entry represents ONE subject-section pair
// Duration = subject's totalHours (lecture + lab combined)
// Professor workload = sum of totalHours assigned to them
const DEFAULT_SLOT_DURATION = 3; // Default slot duration for grid display
const MAX_HOURS_PER_PROFESSOR_PER_WEEK = 36; // Max teaching hours per week (6 hrs × 6 days)
const MAX_HOURS_PER_PROFESSOR_PER_DAY = 8; // Max teaching hours per day

// GET - Fetch schedule with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filterType = searchParams.get('type') || 'master';
    const sectionId = searchParams.get('sectionId');
    const professorId = searchParams.get('professorId');
    const year = searchParams.get('year');

    let scheduleRef = collection(db, 'schedule');
    let queryConstraints = [];

    // Apply filters
    if (sectionId && filterType === 'section') {
      queryConstraints.push(query(collection(db, 'schedule'), where('sectionId', '==', sectionId)));
    }
    if (professorId && filterType === 'professor') {
      queryConstraints.push(query(collection(db, 'schedule'), where('professorId', '==', professorId)));
    }
    if (year && filterType === 'year') {
      queryConstraints.push(query(collection(db, 'schedule'), where('year', '==', parseInt(year))));
    }

    const snapshot = await getDocs(queryConstraints.length > 0 ? queryConstraints[0] : scheduleRef);

    if (snapshot.empty) {
      return NextResponse.json({ schedule: [] });
    }

    const schedule = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as ScheduleItem[];

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

// ============================================================================
// INTERFACES
// ============================================================================

interface ProfessorSchedule {
  id: string;
  name: string;
  email: string;
  departmentIds: string[];
  totalHours: number;                       // Total hours assigned per week
  hoursPerDay: Map<string, number>;         // Hours count per day
  slotsPerDay: Map<string, Set<string>>;    // Time slots used per day (for overlap detection)
}

interface UnassignedSubject {
  subjectCode: string;
  subjectName: string;
  sectionName: string;
  programName: string;
  year: number;
  reason: string;
}

interface ScheduleAssignment {
  id?: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
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
  lectureHours: number;
  labHours: number;
  type: 'lecture' | 'lab' | 'combined';
  createdAt: Date;
}

// ============================================================================
// POST - Auto-generate and save schedule
// ============================================================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionId, academicYear, semester } = body;

    console.log('\n' + '='.repeat(70));
    console.log('SCHEDULE GENERATION - Starting');
    console.log(`Academic Year: ${academicYear || '2024-2025'}`);
    console.log(`Semester: ${semester}`);
    console.log(`Constraints:`);
    console.log(`  - Max hours per professor per week: ${MAX_HOURS_PER_PROFESSOR_PER_WEEK}`);
    console.log(`  - Max hours per professor per day: ${MAX_HOURS_PER_PROFESSOR_PER_DAY}`);
    console.log('='.repeat(70) + '\n');

    // Fetch all required data from Firestore
    const [subjectsSnap, sectionsSnap, usersSnap, deptsSnap, programsSnap] = await Promise.all([
      getDocs(collection(db, 'subjects')),
      getDocs(collection(db, 'sections')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'departments')),
      getDocs(collection(db, 'programs'))
    ]);

    if (subjectsSnap.empty || sectionsSnap.empty) {
      return NextResponse.json(
        { error: 'Please create subjects and sections first' },
        { status: 400 }
      );
    }

    const subjects = subjectsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const sections = sectionsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const professors = usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((user: any) => (user as any).role === 'professor');
    const departments = deptsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const programs = programsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (professors.length === 0) {
      return NextResponse.json(
        { error: 'No professors found' },
        { status: 400 }
      );
    }

    // Delete existing schedule items if we're generating for all sections
    if (!sectionId) {
      const existingSchedule = await getDocs(collection(db, 'schedule'));
      const deleteBatch = writeBatch(db);
      existingSchedule.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      if (!existingSchedule.empty) {
        await deleteBatch.commit();
      }
    }

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    // Check if professor is qualified for subject based on department
    const isProfessorQualifiedForSubject = (prof: ProfessorSchedule, subject: any): boolean => {
      if (!subject.programId) return false;

      const subjectProgram = programs.find((p: any) => p.id === subject.programId);
      if (!subjectProgram) return false;

      if (!subjectProgram.departmentId) return false;

      if (!prof.departmentIds || prof.departmentIds.length === 0) return false;

      return prof.departmentIds.includes(subjectProgram.departmentId);
    };

    // Get subject duration (use totalHours or default)
    const getSubjectDuration = (subject: any): number => {
      const totalHours = subject.totalHours || (subject.lectureHours || 0) + (subject.labHours || 0);
      return Math.max(totalHours, DEFAULT_SLOT_DURATION);
    };

    // Check if professor can take this subject
    const canProfessorTakeSubject = (
      prof: ProfessorSchedule,
      day: string,
      subjectDuration: number
    ): { canAssign: boolean; reason: string | null } => {
      // Check weekly hours limit
      if (prof.totalHours + subjectDuration > MAX_HOURS_PER_PROFESSOR_PER_WEEK) {
        return { 
          canAssign: false, 
          reason: `Would exceed weekly limit (${MAX_HOURS_PER_PROFESSOR_PER_WEEK}h)` 
        };
      }

      // Check daily hours limit
      const hoursToday = prof.hoursPerDay.get(day) || 0;
      if (hoursToday + subjectDuration > MAX_HOURS_PER_PROFESSOR_PER_DAY) {
        return { 
          canAssign: false, 
          reason: `Would exceed daily limit for ${day} (${MAX_HOURS_PER_PROFESSOR_PER_DAY}h)` 
        };
      }

      return { canAssign: true, reason: null };
    };

    // Check if time slot causes conflicts with existing schedule
    const hasTimeConflict = (
      existingSchedule: ScheduleAssignment[],
      professorId: string,
      sectionId: string,
      day: string,
      startSlot: number,
      duration: number
    ): boolean => {
      const endSlot = startSlot + duration;

      return existingSchedule.some((item) => {
        if (item.day !== day) return false;

        const itemEnd = item.startSlot + item.duration;
        const timeOverlap = startSlot < itemEnd && endSlot > item.startSlot;

        if (!timeOverlap) return false;

        // Conflict if same professor OR same section
        return item.professorId === professorId || item.sectionId === sectionId;
      });
    };

    // Helper function to shuffle array (Fisher-Yates)
    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    // Find available time slot for a section on a given day
    const findAvailableSlot = (
      day: string,
      sectionId: string,
      duration: number,
      existingSchedule: ScheduleAssignment[]
    ): number | null => {
      // Calculate max start slot based on duration
      // School hours: 7 AM - 9 PM (slots 1-14 usable, slot 15 is 9 PM for end display)
      // For duration D: start slot N must satisfy N + D <= 15
      // So max start slot = 15 - duration
      const maxStart = 15 - duration;
      
      for (let slot = 1; slot <= maxStart; slot++) {
        const hasConflict = existingSchedule.some((item) => {
          if (item.day !== day || item.sectionId !== sectionId) return false;

          const itemEnd = item.startSlot + item.duration;
          const endSlot = slot + duration;

          return slot < itemEnd && endSlot > item.startSlot;
        });

        if (!hasConflict) {
          return slot;
        }
      }
      return null;
    };

    // Assign subject to professor
    const assignSubjectToProfessor = (
      prof: ProfessorSchedule,
      day: string,
      startSlot: number,
      duration: number
    ): void => {
      prof.totalHours += duration;

      // Update per-day tracking
      const currentHours = prof.hoursPerDay.get(day) || 0;
      prof.hoursPerDay.set(day, currentHours + duration);

      // Update slot tracking
      if (!prof.slotsPerDay.has(day)) {
        prof.slotsPerDay.set(day, new Set<string>());
      }
      const slotsToday = prof.slotsPerDay.get(day)!;
      for (let i = 0; i < duration; i++) {
        slotsToday.add(`${startSlot + i}`);
      }
    };

    // Sort professors by workload (prioritize those with less load)
    const sortProfessorsByWorkload = (profs: ProfessorSchedule[]): ProfessorSchedule[] => {
      return [...profs].sort((a, b) => a.totalHours - b.totalHours);
    };

    // ========================================================================
    // INITIALIZE PROFESSOR TRACKING
    // ========================================================================

    const professorSchedule: ProfessorSchedule[] = professors.map((prof: any) => ({
      id: prof.id,
      name: prof.name,
      email: prof.email,
      departmentIds: prof.departmentIds || [],
      totalHours: 0,
      hoursPerDay: new Map<string, number>(),
      slotsPerDay: new Map<string, Set<string>>()
    }));

    // ========================================================================
    // BUILD SUBJECT-SECTION PAIRS TO SCHEDULE
    // ========================================================================

    const targetSections = sectionId ? sections.filter((s) => s.id === sectionId) : sections;
    const subjectSectionPairs: Array<{
      subject: any;
      section: any;
      uniqueKey: string;
    }> = [];

    targetSections.forEach((section) => {
      const matchingSubjects = subjects.filter((subj: any) => {
        if (!subj.programId) return false;
        const matchesProgram = subj.programId === section.programId;
        const matchesYear = subj.year === section.year;
        const matchesSemester = subj.semester === semester;
        return matchesProgram && matchesYear && matchesSemester;
      });

      matchingSubjects.forEach((subj: any) => {
        subjectSectionPairs.push({
          subject: subj,
          section: section,
          uniqueKey: `${section.id}-${subj.code}`
        });
      });
    });

    console.log(`Total subject-section pairs to schedule: ${subjectSectionPairs.length}`);

    // Calculate total hours needed
    const totalHoursNeeded = subjectSectionPairs.reduce((sum, pair) => {
      return sum + getSubjectDuration(pair.subject);
    }, 0);
    console.log(`Total teaching hours needed: ${totalHoursNeeded}`);
    console.log(`Total professor capacity: ${professors.length * MAX_HOURS_PER_PROFESSOR_PER_WEEK} hours`);

    // ========================================================================
    // SCHEDULE GENERATION
    // ========================================================================

    const schedule: ScheduleAssignment[] = [];
    const assignedKeys = new Set<string>();
    const unassignedSubjects: UnassignedSubject[] = [];
    const batch = writeBatch(db);

    // Shuffle pairs for better distribution
    const shuffledPairs = shuffleArray(subjectSectionPairs);

    for (const pair of shuffledPairs) {
      const { subject, section, uniqueKey } = pair;
      const subjectDuration = getSubjectDuration(subject);

      // Get qualified professors
      const qualifiedProfs = professorSchedule.filter((prof) =>
        isProfessorQualifiedForSubject(prof, subject)
      );

      if (qualifiedProfs.length === 0) {
        const subjectProgram = programs.find((p: any) => p.id === subject.programId);
        const dept = departments.find((d: any) => d.id === subjectProgram?.departmentId);
        unassignedSubjects.push({
          subjectCode: subject.code,
          subjectName: subject.name,
          sectionName: section.sectionName,
          programName: section.programName || 'Unknown',
          year: section.year,
          reason: `No qualified professors in department: ${dept?.name || 'Unknown'}`
        });
        continue;
      }

      let assigned = false;

      // Shuffle days for better distribution
      const shuffledDays = shuffleArray([...DAYS]);

      // Sort professors by workload
      const sortedProfs = sortProfessorsByWorkload(qualifiedProfs);

      // Try each day and professor
      for (const day of shuffledDays) {
        if (assigned) break;

        // Find available slot for section
        const sectionSlot = findAvailableSlot(day, section.id, subjectDuration, schedule);
        if (sectionSlot === null) continue;

        // Try each professor
        for (const prof of sortedProfs) {
          // Check if professor can take this subject
          const { canAssign, reason } = canProfessorTakeSubject(prof, day, subjectDuration);
          if (!canAssign) continue;

          // Check for time conflicts
          if (hasTimeConflict(schedule, prof.id, section.id, day, sectionSlot, subjectDuration)) {
            continue;
          }

          // All checks passed - assign the subject
          const scheduleData: ScheduleAssignment = {
            subjectId: subject.id,
            subjectCode: subject.code,
            subjectName: subject.name,
            sectionId: section.id,
            sectionName: section.sectionName,
            programId: section.programId,
            programName: section.programName,
            year: section.year,
            professorId: prof.id,
            professorName: prof.name,
            day: day,
            startSlot: sectionSlot,
            duration: subjectDuration,
            semester: semester,
            academicYear: academicYear || '2024-2025',
            lectureHours: subject.lectureHours || 0,
            labHours: subject.labHours || 0,
            type: 'combined',
            createdAt: new Date()
          };

          // Save to batch
          const docRef = doc(collection(db, 'schedule'));
          batch.set(docRef, scheduleData);

          // Add to local schedule
          schedule.push({ id: docRef.id, ...scheduleData });

          // Update professor tracking
          assignSubjectToProfessor(prof, day, sectionSlot, subjectDuration);

          // Mark as assigned
          assignedKeys.add(uniqueKey);
          assigned = true;

          console.log(`  ✓ ${subject.code} (${subjectDuration}h) → ${prof.name} | ${day} slot ${sectionSlot} | ${section.sectionName}`);
          break;
        }
      }

      if (!assigned) {
        // Collect reasons why assignment failed
        const reasons: string[] = [];
        
        for (const prof of sortedProfs.slice(0, 3)) {
          for (const day of DAYS.slice(0, 2)) {
            const { reason } = canProfessorTakeSubject(prof, day, subjectDuration);
            if (reason) {
              reasons.push(`${prof.name}: ${reason}`);
            }
          }
        }

        unassignedSubjects.push({
          subjectCode: subject.code,
          subjectName: subject.name,
          sectionName: section.sectionName,
          programName: section.programName || 'Unknown',
          year: section.year,
          reason: reasons.length > 0 
            ? `Could not assign: ${reasons.slice(0, 3).join('; ')}`
            : 'No available time slots or professor capacity'
        });
      }
    }

    // ========================================================================
    // COMMIT TO DATABASE
    // ========================================================================

    await batch.commit();

    // ========================================================================
    // LOG SUMMARY
    // ========================================================================

    console.log('\n' + '='.repeat(70));
    console.log('SCHEDULE GENERATION SUMMARY');
    console.log('='.repeat(70));

    console.log(`\nTotal sections processed: ${targetSections.length}`);
    console.log(`Total subject-section pairs: ${subjectSectionPairs.length}`);
    console.log(`Total assigned: ${assignedKeys.size}`);
    console.log(`Unassigned: ${unassignedSubjects.length}`);

    // Calculate actual hours
    const totalHoursAssigned = schedule.reduce((sum, item) => sum + item.duration, 0);
    console.log(`Total teaching hours assigned: ${totalHoursAssigned}`);

    console.log('\n--- Professor Workload Distribution ---');
    professorSchedule.forEach((prof) => {
      if (prof.totalHours > 0) {
        console.log(`\n${prof.name}:`);
        console.log(`  Total Hours: ${prof.totalHours}`);
        for (const day of DAYS) {
          const dayHours = prof.hoursPerDay.get(day) || 0;
          if (dayHours > 0) {
            console.log(`  ${day}: ${dayHours} hours`);
          }
        }
      }
    });

    if (unassignedSubjects.length > 0) {
      console.log('\n--- Unassigned Subjects (first 10) ---');
      unassignedSubjects.slice(0, 10).forEach((u) => {
        console.log(`  ✗ ${u.subjectCode} (${u.sectionName}) - ${u.reason}`);
      });
    }

    console.log('\n' + '='.repeat(70) + '\n');

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return NextResponse.json({
      schedule,
      stats: {
        totalSections: targetSections.length,
        totalSubjectSectionPairs: subjectSectionPairs.length,
        totalAssigned: assignedKeys.size,
        totalUnassigned: unassignedSubjects.length,
        totalHoursAssigned,
        totalHoursNeeded,
        unassignedSubjects: unassignedSubjects,
        professorWorkload: professorSchedule.map((prof) => ({
          id: prof.id,
          name: prof.name,
          email: prof.email,
          totalHours: prof.totalHours,
          hoursPerDay: Object.fromEntries(prof.hoursPerDay)
        }))
      }
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    return NextResponse.json(
      { error: 'Failed to generate schedule' },
      { status: 500 }
    );
  }
}
