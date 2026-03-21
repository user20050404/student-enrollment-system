export interface Subject {
  id: number;
  subject_code: string;
  subject_name: string;
  units: number;
  description: string;
  status: string;
  offered_on: string;
}

export interface Student {
  id: number;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  year_level: string;
  program: string;
  status: string;
  created_at: string;
}

export interface Section {
  id: number;
  subject: number;
  subject_code: string;
  subject_name: string;
  section_code: string;
  max_capacity: number;
  current_count: number;
  available_slots: number;
  schedule: string;
  room: string;
  semester: string;
  school_year: string;
  status: string;
}

export interface Enrollment {
  id: number;
  student: number;
  section: number;
  student_name: string;
  student_number: string;
  section_code: string;
  subject_code: string;
  subject_name: string;
  units: number;
  enrolled_at: string;
  status: string;
}

export interface EnrollmentSummary {
  id: number;
  student: number;
  student_name: string;
  student_number: string;
  semester: string;
  school_year: string;
  total_enrolled_units: number;
  total_sections: number;
  last_updated: string;
}