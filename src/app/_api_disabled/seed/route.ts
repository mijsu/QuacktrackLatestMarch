import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, where, writeBatch, doc } from 'firebase/firestore';

// ============================================================================
// CONFIGURATION - Adjust these values to control seed data
// ============================================================================
const NUM_PROFESSORS = 60;
const SECTIONS_PER_YEAR_LEVEL = 15; // 15 sections per year level
const YEARS_PER_PROGRAM = 4; // All programs are 4-year programs
const SUBJECTS_PER_YEAR_LEVEL = 9; // Per semester
const SECTIONS_PER_PROGRAM = SECTIONS_PER_YEAR_LEVEL * YEARS_PER_PROGRAM; // 60 sections per program

// All programs are 4-year programs
// Total sections per program: 15 × 4 = 60
// Total sections overall: 60 × 4 programs = 240

// Department configuration
const DEPARTMENTS_DATA = [
  { name: 'Institute of Information and Communication Technology', code: 'IICT', description: 'Information Technology and Computer Science programs' },
  { name: 'Institute of Business and Office Administration', code: 'IBOA', description: 'Business and Office Administration programs' },
];

// Program configuration (mapped to departments by index)
// All programs are 4-year bachelor programs
const PROGRAMS_DATA = [
  // IICT Programs (departmentIndex: 0)
  { name: 'Bachelor of Science in Information Technology', code: 'BSIT', departmentIndex: 0 },
  { name: 'Bachelor of Science in Computer Science', code: 'BSCS', departmentIndex: 0 },
  // IBOA Programs (departmentIndex: 1)
  { name: 'Bachelor of Science in Office Administration', code: 'BSOA', departmentIndex: 1 },
  { name: 'Bachelor of Science in Business Administration', code: 'BSBA', departmentIndex: 1 },
];

// Subject templates for IICT programs (BSIT and BSCS)
// 9 subjects per semester per year level = 72 subjects per program
const IICT_SUBJECTS = [
  // Year 1 - Semester 1 (9 subjects)
  { code: 'IT101', name: 'Introduction to Computing', year: 1, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT102', name: 'Computer Programming I', year: 1, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT103', name: 'College Algebra', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT104', name: 'Understanding the Self', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT105', name: 'Fundamentals of Logic', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT106', name: 'Computer Hardware Fundamentals', year: 1, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT107', name: 'Technical Writing', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT108', name: 'Physical Education I', year: 1, semester: 1, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'IT109', name: 'National Service Training Program I', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 1 - Semester 2 (9 subjects)
  { code: 'IT111', name: 'Computer Programming II', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT112', name: 'Discrete Mathematics', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT113', name: 'Web Technologies', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT114', name: 'Purposive Communication', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT115', name: 'Database Fundamentals', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT116', name: 'Digital Electronics', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT117', name: 'Environmental Science', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT118', name: 'Physical Education II', year: 1, semester: 2, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'IT119', name: 'National Service Training Program II', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 2 - Semester 1 (9 subjects)
  { code: 'IT201', name: 'Data Structures and Algorithms', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT202', name: 'Object-Oriented Programming', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT203', name: 'Database Management Systems', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT204', name: 'Probability and Statistics', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT205', name: 'Networking Fundamentals', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT206', name: 'Automata Theory', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT207', name: 'Technopreneurship', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT208', name: 'Physical Education III', year: 2, semester: 1, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'IT209', name: 'Programming Languages', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  // Year 2 - Semester 2 (9 subjects)
  { code: 'IT211', name: 'Operating Systems', year: 2, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT212', name: 'Web Application Development', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT213', name: 'Software Engineering', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT214', name: 'System Administration', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT215', name: 'Computer Graphics', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT216', name: 'Linear Algebra', year: 2, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT217', name: 'Technical Elective I', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT218', name: 'Physical Education IV', year: 2, semester: 2, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'IT219', name: 'Multimedia Systems', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  // Year 3 - Semester 1 (9 subjects)
  { code: 'IT301', name: 'Advanced Database Systems', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT302', name: 'Mobile Application Development', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT303', name: 'Information Security', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT304', name: 'Human-Computer Interaction', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT305', name: 'Systems Analysis and Design', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT306', name: 'Artificial Intelligence', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT307', name: 'Algorithm Design and Analysis', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT308', name: 'Network Security', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT309', name: 'Technical Elective II', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  // Year 3 - Semester 2 (9 subjects)
  { code: 'IT311', name: 'Cloud Computing', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT312', name: 'Network Administration', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT313', name: 'IT Project Management', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT314', name: 'Data Communications', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT315', name: 'Machine Learning', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT316', name: 'Software Testing', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT317', name: 'Data Mining', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT318', name: 'Technical Elective III', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT319', name: 'Enterprise Systems', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  // Year 4 - Semester 1 (9 subjects)
  { code: 'IT401', name: 'Capstone Project I', year: 4, semester: 1, units: 3, lectureHours: 1, labHours: 6, totalHours: 7 },
  { code: 'IT402', name: 'IT Elective I', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT403', name: 'Professional Ethics', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT404', name: 'Entrepreneurship', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT405', name: 'Practicum Preparation', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT406', name: 'Advanced Web Development', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT407', name: 'IT Audit and Controls', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT408', name: 'Big Data Analytics', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT409', name: 'IT Service Management', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 4 - Semester 2 (9 subjects)
  { code: 'IT411', name: 'Capstone Project II', year: 4, semester: 2, units: 3, lectureHours: 1, labHours: 6, totalHours: 7 },
  { code: 'IT412', name: 'IT Elective II', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT413', name: 'Practicum/Internship', year: 4, semester: 2, units: 6, lectureHours: 0, labHours: 18, totalHours: 18 },
  { code: 'IT414', name: 'Emerging Technologies', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT415', name: 'Internet of Things', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT416', name: 'Blockchain Technology', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'IT417', name: 'Cybersecurity Management', year: 4, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT418', name: 'IT Governance', year: 4, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'IT419', name: 'DevOps and Deployment', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
];

// Subject templates for IBOA programs (BSOA and BSBA)
// 9 subjects per semester per year level = 72 subjects per program
const IBOA_SUBJECTS = [
  // Year 1 - Semester 1 (9 subjects)
  { code: 'OA101', name: 'Introduction to Office Administration', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA102', name: 'Business Mathematics', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA103', name: 'Business Communication', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA104', name: 'Computer Applications I', year: 1, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA105', name: 'Fundamentals of Accounting', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA106', name: 'Office Procedures I', year: 1, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA107', name: 'Personality Development', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA108', name: 'Physical Education I', year: 1, semester: 1, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'OA109', name: 'National Service Training Program I', year: 1, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 1 - Semester 2 (9 subjects)
  { code: 'OA111', name: 'Office Procedures II', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA112', name: 'Business Statistics', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA113', name: 'Computer Applications II', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA114', name: 'Business Ethics', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA115', name: 'Records Management', year: 1, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA116', name: 'Technical Writing', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA117', name: 'Cultural Education', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA118', name: 'Physical Education II', year: 1, semester: 2, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'OA119', name: 'National Service Training Program II', year: 1, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 2 - Semester 1 (9 subjects)
  { code: 'OA201', name: 'Office Procedures III', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA202', name: 'Principles of Management', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA203', name: 'Business Law I', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA204', name: 'Typewriting/Keyboarding', year: 2, semester: 1, units: 3, lectureHours: 1, labHours: 6, totalHours: 7 },
  { code: 'OA205', name: 'Shorthand/Stenography I', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA206', name: 'Computer Applications III', year: 2, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA207', name: 'Marketing Principles', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA208', name: 'Physical Education III', year: 2, semester: 1, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'OA209', name: 'Business Correspondence', year: 2, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 2 - Semester 2 (9 subjects)
  { code: 'OA211', name: 'Office Management', year: 2, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA212', name: 'Business Law II', year: 2, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA213', name: 'Shorthand/Stenography II', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA214', name: 'Human Behavior in Organizations', year: 2, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA215', name: 'Desktop Publishing', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA216', name: 'Financial Accounting', year: 2, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA217', name: 'Business Presentation', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA218', name: 'Physical Education IV', year: 2, semester: 2, units: 2, lectureHours: 2, labHours: 0, totalHours: 2 },
  { code: 'OA219', name: 'Database Management', year: 2, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  // Year 3 - Semester 1 (9 subjects)
  { code: 'OA301', name: 'Administrative Office Management', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA302', name: 'Human Resource Management', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA303', name: 'Financial Management', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA304', name: 'Office Equipment and Machines', year: 3, semester: 1, units: 3, lectureHours: 1, labHours: 6, totalHours: 7 },
  { code: 'OA305', name: 'Advanced Computer Applications', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA306', name: 'Business Research Methods', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA307', name: 'Economics', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA308', name: 'Office Layout and Design', year: 3, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA309', name: 'Office Systems Analysis', year: 3, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 3 - Semester 2 (9 subjects)
  { code: 'OA311', name: 'Public Relations', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA312', name: 'Event Management', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA313', name: 'Business Report Writing', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA314', name: 'Entrepreneurship', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA315', name: 'Web Design and Development', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA316', name: 'Quality Management', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA317', name: 'Project Management', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA318', name: 'Business Elective I', year: 3, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA319', name: 'Customer Relations Management', year: 3, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  // Year 4 - Semester 1 (9 subjects)
  { code: 'OA401', name: 'Strategic Office Management', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA402', name: 'Office Administration Elective I', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA403', name: 'Professional Development', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA404', name: 'Research Methods', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA405', name: 'Office Systems Analysis', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA406', name: 'Business Policy', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA407', name: 'Office Administration Seminar', year: 4, semester: 1, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA408', name: 'Capstone Project I', year: 4, semester: 1, units: 3, lectureHours: 1, labHours: 6, totalHours: 7 },
  { code: 'OA409', name: 'Practicum Preparation', year: 4, semester: 1, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  // Year 4 - Semester 2 (9 subjects)
  { code: 'OA411', name: 'Practicum/Internship', year: 4, semester: 2, units: 6, lectureHours: 0, labHours: 18, totalHours: 18 },
  { code: 'OA412', name: 'Office Administration Elective II', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA413', name: 'Capstone Project', year: 4, semester: 2, units: 3, lectureHours: 1, labHours: 6, totalHours: 7 },
  { code: 'OA414', name: 'Seminar in Office Administration', year: 4, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA415', name: 'Office Administration Trends', year: 4, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA416', name: 'Business Analytics', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA417', name: 'Professional Ethics in Business', year: 4, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
  { code: 'OA418', name: 'Digital Office Management', year: 4, semester: 2, units: 3, lectureHours: 2, labHours: 3, totalHours: 5 },
  { code: 'OA419', name: 'Office Administration Review', year: 4, semester: 2, units: 3, lectureHours: 3, labHours: 0, totalHours: 3 },
];

// Professor name components for generating random names
const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Charles',
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
  'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
  'Emily', 'Emma', 'Olivia', 'Sophia', 'Isabella', 'Ava', 'Mia', 'Charlotte', 'Amelia', 'Harper',
  'Alejandro', 'Gabriel', 'Miguel', 'Rafael', 'Carlos', 'Antonio', 'Francisco', 'Eduardo', 'Fernando', 'Luis',
  'Maria', 'Ana', 'Carmen', 'Rosa', 'Isabel', 'Laura', 'Patricia', 'Elena', 'Sofia', 'Lucia'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
];

// GET - Check if database is already seeded
export async function GET() {
  try {
    const existingData = await checkExistingData();
    
    return NextResponse.json({
      success: true,
      existingData,
      message: existingData.hasData 
        ? 'Database already has data. Use POST to seed.' 
        : 'Database is empty. Use POST to seed.'
    });
  } catch (error) {
    console.error('Error checking database:', error);
    return NextResponse.json(
      { error: 'Failed to check database. ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// POST - Seed the database
export async function POST(request: NextRequest) {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('DATABASE SEEDING - Starting');
    console.log(`Configuration:`);
    console.log(`  - Professors: ${NUM_PROFESSORS}`);
    console.log(`  - Sections per program: ${SECTIONS_PER_PROGRAM}`);
    console.log(`  - Subjects per year level per semester: ${SUBJECTS_PER_YEAR_LEVEL}`);
    console.log('='.repeat(70) + '\n');

    // Check if already seeded
    const existingData = await checkExistingData();
    if (existingData.hasData) {
      return NextResponse.json(
        { 
          error: 'Database already has data. Clear existing data before seeding.',
          existingData 
        },
        { status: 400 }
      );
    }

    const results = {
      departments: 0,
      programs: 0,
      professors: 0,
      subjects: 0,
      sections: 0,
    };

    // Step 1: Create Departments
    console.log('Step 1: Creating departments...');
    const departmentIds: string[] = [];
    
    for (const deptData of DEPARTMENTS_DATA) {
      const deptRef = await addDoc(collection(db, 'departments'), {
        ...deptData,
        createdAt: new Date()
      });
      departmentIds.push(deptRef.id);
      results.departments++;
    }
    console.log(`  Created ${results.departments} departments`);

    // Step 2: Create Programs
    console.log('Step 2: Creating programs...');
    const programIds: string[] = [];
    const programData: Array<{ id: string; name: string; code: string; departmentId: string }> = [];
    
    for (const progData of PROGRAMS_DATA) {
      const progRef = await addDoc(collection(db, 'programs'), {
        name: progData.name,
        code: progData.code,
        departmentId: departmentIds[progData.departmentIndex],
        createdAt: new Date()
      });
      programIds.push(progRef.id);
      programData.push({
        id: progRef.id,
        name: progData.name,
        code: progData.code,
        departmentId: departmentIds[progData.departmentIndex]
      });
      results.programs++;
    }
    console.log(`  Created ${results.programs} programs`);

    // Step 3: Create Professors (distributed across departments)
    console.log('Step 3: Creating professors...');
    const professorBatch = writeBatch(db);
    const professorData: Array<{ id: string; departmentIds: string[] }> = [];
    
    const profsPerDepartment = Math.ceil(NUM_PROFESSORS / DEPARTMENTS_DATA.length);
    
    for (let i = 0; i < NUM_PROFESSORS; i++) {
      // Assign to primary department (round-robin with some overlap)
      const primaryDeptIndex = i % DEPARTMENTS_DATA.length;
      const departmentId = departmentIds[primaryDeptIndex];
      
      // Some professors can teach in multiple departments (20% chance)
      let assignedDepts = [departmentId];
      if (Math.random() < 0.2 && DEPARTMENTS_DATA.length > 1) {
        const secondaryDeptIndex = (primaryDeptIndex + 1) % DEPARTMENTS_DATA.length;
        if (!assignedDepts.includes(departmentIds[secondaryDeptIndex])) {
          assignedDepts.push(departmentIds[secondaryDeptIndex]);
        }
      }

      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
      const middleInitial = String.fromCharCode(65 + (i % 26));
      
      const profRef = doc(collection(db, 'users'));
      professorBatch.set(profRef, {
        email: `professor${i + 1}@university.edu`,
        name: `${firstName} ${middleInitial}. ${lastName}`,
        role: 'professor',
        departmentIds: assignedDepts,
        createdAt: new Date()
      });
      
      professorData.push({
        id: profRef.id,
        departmentIds: assignedDepts
      });
    }
    
    await professorBatch.commit();
    results.professors = NUM_PROFESSORS;
    console.log(`  Created ${results.professors} professors`);
    console.log(`  Department distribution: ~${profsPerDepartment} per department`);

    // Step 4: Create Subjects for each program
    console.log('Step 4: Creating subjects...');
    const subjectBatch = writeBatch(db);
    
    for (const prog of programData) {
      // Determine which subject template to use based on department
      const deptIndex = departmentIds.indexOf(prog.departmentId);
      let subjectTemplate: typeof IICT_SUBJECTS;
      
      if (deptIndex === 0) {
        // IICT department - BSIT and BSCS programs
        subjectTemplate = IICT_SUBJECTS;
      } else {
        // IBOA department - BSOA and BSBA programs
        subjectTemplate = IBOA_SUBJECTS;
      }

      // Create all subjects from the template for this program
      // Templates now have exactly 9 subjects per semester per year level
      for (const subj of subjectTemplate) {
        const subjRef = doc(collection(db, 'subjects'));
        subjectBatch.set(subjRef, {
          ...subj,
          programId: prog.id,
          programName: prog.name,
          createdAt: new Date()
        });
        results.subjects++;
      }
    }
    
    await subjectBatch.commit();
    console.log(`  Created ${results.subjects} subjects`);

    // Step 5: Create Sections for each program
    // 15 sections per year level × 4 years = 60 sections per program
    // 60 sections × 4 programs = 240 total sections
    console.log('Step 5: Creating sections...');
    const sectionBatch = writeBatch(db);
    
    const sectionLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
    
    for (const prog of programData) {
      // All programs are 4-year programs
      const totalYears = 4;
      
      for (let year = 1; year <= totalYears; year++) {
        // Create 15 sections per year level
        for (let s = 0; s < SECTIONS_PER_YEAR_LEVEL; s++) {
          const sectionRef = doc(collection(db, 'sections'));
          sectionBatch.set(sectionRef, {
            programId: prog.id,
            programName: prog.name,
            sectionName: `${prog.code}-${year}${sectionLetters[s]}`,
            year: year,
            createdAt: new Date()
          });
          results.sections++;
        }
      }
    }
    
    await sectionBatch.commit();
    console.log(`  Created ${results.sections} sections`);

    // Calculate capacity
    // 60 professors × 36 subjects per professor = 2,160 total capacity
    // 240 sections × 9 subjects = 2,160 total schedules needed
    const totalCapacity = NUM_PROFESSORS * 36; // 36 subjects per professor
    const estimatedSubjectsNeeded = results.sections * SUBJECTS_PER_YEAR_LEVEL; // Sections × 9 subjects
    const capacityPercent = ((totalCapacity / (estimatedSubjectsNeeded || 1)) * 100).toFixed(1);

    console.log('\n' + '='.repeat(70));
    console.log('SEEDING COMPLETE');
    console.log('='.repeat(70));
    console.log(`\nSummary:`);
    console.log(`  Departments: ${results.departments}`);
    console.log(`  Programs: ${results.programs}`);
    console.log(`  Professors: ${results.professors}`);
    console.log(`  Subjects: ${results.subjects}`);
    console.log(`  Sections: ${results.sections}`);
    console.log(`\nCapacity Analysis:`);
    console.log(`  Total professor capacity: ${totalCapacity} subjects`);
    console.log(`  Estimated subjects per semester: ~${Math.round(results.subjects / 2)}`);
    console.log(`  Capacity utilization: ~${capacityPercent}%`);
    console.log(`\nSchedule Distribution:`);
    console.log(`  6 schedules per professor per day`);
    console.log(`  6 days per week (Mon-Sat)`);
    console.log(`  3 hours per subject`);
    console.log(`  School hours: 7 AM - 9 PM`);
    console.log('='.repeat(70) + '\n');

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: results,
      analysis: {
        totalProfessorCapacity: totalCapacity,
        estimatedSubjectsPerSemester: Math.round(results.subjects / 2),
        capacityPercent: parseFloat(capacityPercent)
      }
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database. ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE - Clear all data
export async function DELETE() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('CLEARING DATABASE - Starting');
    console.log('='.repeat(70) + '\n');

    const collections = ['departments', 'programs', 'users', 'subjects', 'sections', 'schedule'];
    let totalDeleted = 0;

    for (const colName of collections) {
      const snapshot = await getDocs(collection(db, colName));
      if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        console.log(`  Deleted ${snapshot.size} documents from ${colName}`);
        totalDeleted += snapshot.size;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`DATABASE CLEARED - Total: ${totalDeleted} documents deleted`);
    console.log('='.repeat(70) + '\n');

    return NextResponse.json({
      success: true,
      message: `Database cleared. ${totalDeleted} documents deleted.`,
      deleted: totalDeleted
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    return NextResponse.json(
      { error: 'Failed to clear database. ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper function to check existing data
async function checkExistingData() {
  const [depts, progs, profs, subs, secs] = await Promise.all([
    getDocs(collection(db, 'departments')),
    getDocs(collection(db, 'programs')),
    getDocs(query(collection(db, 'users'), where('role', '==', 'professor'))),
    getDocs(collection(db, 'subjects')),
    getDocs(collection(db, 'sections')),
  ]);

  const data = {
    departments: depts.size,
    programs: progs.size,
    professors: profs.size,
    subjects: subs.size,
    sections: secs.size,
    hasData: depts.size > 0 || progs.size > 0 || profs.size > 0 || subs.size > 0 || secs.size > 0
  };

  return data;
}
