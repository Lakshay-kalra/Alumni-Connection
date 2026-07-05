export type Role = "ADMIN" | "ALUMNI" | "STUDENT";

export type VerificationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  email: string;
  role: Role;
  emailVerified: Date | string | null;
  image: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  enrollmentNumber: string | null;
  photo: string | null;
  department: string;
  batch: string | null;
  careerGoals: string[];
  interests: string[];
  bio: string | null;
  verificationStatus: VerificationStatus;
  studentIdCard: string | null;
  verifiedAt: Date | string | null;
  verifiedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AlumniProfile {
  id: string;
  userId: string;
  name: string;
  photo: string | null;
  batch: string;
  department: string;
  company: string | null;
  position: string | null;
  yearsExperience: number | null;
  industry: string | null;
  location: string | null;
  skills: string[];
  expertise: string[];
  interests: string[];
  linkedin: string | null;
  portfolio: string | null;
  mentorshipAvailable: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | string | null;
  verifiedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: Date | string;
}
