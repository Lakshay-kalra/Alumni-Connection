import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import * as student from "../controllers/student.controller";
import * as alumni from "../controllers/alumni.controller";
import * as mentorship from "../controllers/mentorship.controller";
import * as chat from "../controllers/chat.controller";
import * as event from "../controllers/event.controller";
import * as announcement from "../controllers/announcement.controller";
import * as notification from "../controllers/notification.controller";
import * as admin from "../controllers/admin.controller";
import * as community from "../controllers/community.controller";
import * as upload from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Authentication
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.post("/auth/logout", auth.logout);
router.get("/auth/me", requireAuth, auth.me);
router.get("/auth/verify-email", auth.verifyEmailToken);

// Students
router.get("/students/me", requireAuth, student.getProfile);
router.put("/students/me", requireAuth, student.updateProfile);
router.get("/students/profile", requireAuth, student.getProfile);
router.put("/students/profile", requireAuth, student.updateProfile);
router.post("/students/verify", requireAuth, student.submitVerification);

// Alumni
router.get("/alumni", requireAuth, alumni.listAlumni);
router.get("/alumni/:id", requireAuth, alumni.getAlumniDetails);
router.put("/alumni/me", requireAuth, alumni.updateProfile);
router.put("/alumni/profile", requireAuth, alumni.updateProfile);
router.post("/alumni/request", requireAuth, alumni.submitVerification);
router.post("/alumni/verify", requireAuth, alumni.submitVerification);

// Mentorship
router.get("/mentorship", requireAuth, mentorship.listMentorships);
router.post("/mentorship/request", requireAuth, mentorship.requestMentorship);
router.post("/mentorship/accept", requireAuth, mentorship.acceptRequest);
router.post("/mentorship/reject", requireAuth, mentorship.rejectRequest);

// Chat
router.get("/chat/conversations", requireAuth, chat.getUserConversations);
router.get("/chat/messages/:conversationId", requireAuth, chat.getChatMessages);
router.get("/chat/:conversationId", requireAuth, chat.getChatMessages);
router.post("/chat/send", requireAuth, chat.sendMessage);

// Events
router.get("/events", requireAuth, event.listEvents);
router.post("/events", requireAuth, event.createEvent);
router.put("/events/:id", requireAuth, event.updateEvent);
router.delete("/events/:id", requireAuth, event.deleteEvent);
router.post("/events/register", requireAuth, event.toggleRegistration);

// Announcements
router.get("/announcements", requireAuth, announcement.listAnnouncements);
router.post("/announcements", requireAuth, announcement.createAnnouncement);

// Notifications
router.get("/notifications", requireAuth, notification.getNotifications);
router.put("/notifications/read", requireAuth, notification.markAsRead);

// Community
router.get("/community", requireAuth, community.getCommunityFeed);
router.post("/community/message", requireAuth, community.postCommunityMessage);

// Uploads
router.post("/upload", requireAuth, upload.uploadFile);

// Admin dashboard and management
router.get("/admin/dashboard", requireAuth, admin.getDashboardStats);
router.get("/admin/users", requireAuth, admin.listUsers);
router.delete("/admin/users/:userId", requireAuth, admin.deleteUser);
router.put("/admin/verify", requireAuth, admin.verifyUser);
router.post("/admin/verify-student", requireAuth, admin.verifyStudent);
router.post("/admin/verify-alumni", requireAuth, admin.verifyAlumni);
router.post("/admin/broadcast", requireAuth, admin.createBroadcast);
router.post("/admin/import-alumni", requireAuth, admin.importAlumni);

export default router;
