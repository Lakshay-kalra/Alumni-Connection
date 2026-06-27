import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    role: z.enum(["STUDENT", "ALUMNI"]),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain uppercase letter")
      .regex(/[a-z]/, "Must contain lowercase letter")
      .regex(/[0-9]/, "Must contain number"),
    confirmPassword: z.string(),
    name: z.string().min(2, "Name is required"),
    department: z.string().min(2, "Department is required"),
    batch: z.string().optional(),
    company: z.string().optional(),
    position: z.string().optional(),
    careerGoals: z.string().optional(),
    interests: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      if (data.role === "ALUMNI") return !!data.batch && data.batch.length >= 4;
      return true;
    },
    { message: "Batch year is required for alumni", path: ["batch"] }
  );

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const mentorshipRequestSchema = z.object({
  alumniId: z.string().min(1),
  motivation: z.string().min(20, "Please provide at least 20 characters"),
  careerGoal: z.string().min(10, "Please describe your career goal"),
  expectations: z.string().min(10, "Please describe your expectations"),
});

export const studentProfileSchema = z.object({
  name: z.string().min(2),
  department: z.string().min(2),
  batch: z.string().optional(),
  careerGoals: z.string().optional(),
  interests: z.string().optional(),
  bio: z.string().optional(),
});

export const alumniProfileSchema = z.object({
  name: z.string().min(2),
  batch: z.string().min(4),
  department: z.string().min(2),
  company: z.string().optional(),
  position: z.string().optional(),
  yearsExperience: z.coerce.number().optional(),
  industry: z.string().optional(),
  location: z.string().optional(),
  skills: z.string().optional(),
  expertise: z.string().optional(),
  interests: z.string().optional(),
  linkedin: z.string().url().optional().or(z.literal("")),
  portfolio: z.string().url().optional().or(z.literal("")),
  mentorshipAvailable: z.boolean().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  date: z.string().min(1),
  time: z.string().min(1),
  venue: z.string().min(2),
  bannerImage: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(10),
  category: z.enum([
    "NEWS",
    "ACHIEVEMENT",
    "PLACEMENT_REPORT",
    "DEPARTMENT_UPDATE",
    "CAMPUS_UPDATE",
  ]),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().max(5000).optional().default(""),
  type: z.enum(["TEXT", "FILE", "RESUME"]).default("TEXT"),
  fileUrl: z.string().optional().nullable(),
  fileName: z.string().optional().nullable(),
});

export const communityMessageSchema = z.object({
  broadcastId: z.string().min(1),
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MentorshipRequestInput = z.infer<typeof mentorshipRequestSchema>;
