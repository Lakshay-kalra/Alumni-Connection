import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_ADMIN_EMAIL =
  process.env.DEFAULT_ADMIN_EMAIL || "admin@alumninetwork.com";
const DEFAULT_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD || "Admin@123";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("🌱 Seeding Chitkara University Database...");

  // Clean existing tables (except admin user to preserve config)
  await prisma.notification.deleteMany();
  await prisma.communityMessage.deleteMany();
  await prisma.adminBroadcast.deleteMany();
  await prisma.message.deleteMany();
  await prisma.mentorship.deleteMany();
  await prisma.mentorshipRequest.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.alumniProfile.deleteMany();
  await prisma.userPresence.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany({
    where: { email: { not: DEFAULT_ADMIN_EMAIL } },
  });

  // 1. Seed Admin
  const adminPasswordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {
      passwordHash: adminPasswordHash,
    },
    create: {
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // 2. Seed Students (Chitkara emails & fallbacks)
  const studentData = [
    {
      email: "arjun.sharma@chitkara.edu.in",
      name: "Arjun Sharma",
      enrollmentNumber: "2010991001",
      department: "Computer Science Engineering",
      batch: "2026",
      careerGoals: ["Software Engineer", "Full Stack Developer"],
      interests: ["Web Development", "AI", "Open Source"],
      verified: true,
    },
    {
      email: "priya.patel@chitkara.edu.in",
      name: "Priya Patel",
      enrollmentNumber: "2110991542",
      department: "Electronics & Communication Engineering",
      batch: "2027",
      careerGoals: ["Hardware Engineer", "IoT Specialist"],
      interests: ["Embedded Systems", "Robotics"],
      verified: true,
    },
    {
      email: "rahul.verma@gmail.com", // Option 2 student
      name: "Rahul Verma",
      enrollmentNumber: "2010992314",
      department: "Computer Science Engineering",
      batch: "2026",
      careerGoals: ["Data Scientist", "ML Engineer"],
      interests: ["Machine Learning", "Data Analytics"],
      verified: false, // Remains PENDING for admin approval
    },
  ];

  const students = [];
  for (const s of studentData) {
    const user = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: await hashPassword("Student@123"),
        role: "STUDENT",
        emailVerified: s.verified ? new Date() : null,
        studentProfile: {
          create: {
            name: s.name,
            enrollmentNumber: s.enrollmentNumber,
            department: s.department,
            batch: s.batch,
            careerGoals: s.careerGoals,
            interests: s.interests,
            verificationStatus: s.verified ? "APPROVED" : "PENDING",
          },
        },
      },
      include: { studentProfile: true },
    });
    students.push(user);
  }
  console.log(`✅ Created ${students.length} students`);

  // 3. Seed Alumni
  const alumniData = [
    {
      email: "vikram.singh@google.com",
      name: "Vikram Singh",
      batch: "2018",
      department: "Computer Science Engineering",
      company: "Google",
      position: "Senior Software Engineer",
      yearsExperience: 6,
      industry: "Technology",
      location: "Bangalore, India",
      skills: ["JavaScript", "Python", "System Design"],
      expertise: ["Backend Development", "Cloud Architecture"],
      interests: ["Mentorship", "Startups"],
      linkedin: "https://linkedin.com/in/vikram-singh-chitkara",
      verified: true,
    },
    {
      email: "ananya.reddy@microsoft.com",
      name: "Ananya Reddy",
      batch: "2019",
      department: "Computer Science Engineering",
      company: "Microsoft",
      position: "Product Manager",
      yearsExperience: 5,
      industry: "Technology",
      location: "Hyderabad, India",
      skills: ["Product Strategy", "Agile", "UX"],
      expertise: ["Product Management", "Leadership"],
      interests: ["Product Design", "Career Guidance"],
      linkedin: "https://linkedin.com/in/ananya-reddy-pm",
      verified: true,
    },
    {
      email: "karthik.nair@intel.com",
      name: "Karthik Nair",
      batch: "2020",
      department: "Electronics & Communication Engineering",
      company: "Intel",
      position: "Hardware Engineer",
      yearsExperience: 4,
      industry: "Semiconductors",
      location: "Pune, India",
      skills: ["VLSI", "Embedded C", "FPGA"],
      expertise: ["Hardware Design", "IoT"],
      interests: ["Electronics", "Research"],
      linkedin: "https://linkedin.com/in/karthik-intel",
      verified: true,
    },
    {
      email: "sanjay.kumar@tesla.com",
      name: "Sanjay Kumar",
      batch: "2021",
      department: "Mechanical Engineering",
      company: "Tesla",
      position: "Design Engineer",
      yearsExperience: 3,
      industry: "Automotive",
      location: "California, USA",
      skills: ["CAD", "Simulation", "Manufacturing"],
      expertise: ["Automotive Design"],
      interests: ["EV Technology"],
      linkedin: "https://linkedin.com/in/sanjay-tesla",
      verified: false, // PENDING verification
    },
  ];

  const alumni = [];
  for (const a of alumniData) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        passwordHash: await hashPassword("Alumni@123"),
        role: "ALUMNI",
        emailVerified: new Date(),
        alumniProfile: {
          create: {
            name: a.name,
            batch: a.batch,
            department: a.department,
            company: a.company,
            position: a.position,
            yearsExperience: a.yearsExperience,
            industry: a.industry,
            location: a.location,
            skills: a.skills,
            expertise: a.expertise,
            interests: a.interests,
            linkedin: a.linkedin,
            verificationStatus: a.verified ? "APPROVED" : "PENDING",
            verifiedAt: a.verified ? new Date() : null,
            verifiedBy: a.verified ? admin.id : null,
          },
        },
      },
      include: { alumniProfile: true },
    });
    alumni.push(user);
  }
  console.log(`✅ Created ${alumni.length} alumni`);

  // 4. Seed Events (Chitkara Themed)
  const events = [
    {
      title: "Chitkara Alumni Homecoming Meet 2026",
      description:
        "Reconnect with your alma mater, interact with current batch students, share career journeys, and witness the growth of Chitkara University. Refreshments and dinner included.",
      date: new Date("2026-08-15T10:00:00"),
      time: "10:00 AM - 6:00 PM",
      venue: "Exploret Auditorium, Chitkara Rajpura Campus",
      bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    },
    {
      title: "Chitkara Placement Drive Masterclass",
      description:
        "An exclusive interaction where placed alumni share tips, interview formats, and prep strategies for upcoming placement drives by Microsoft, Amazon, and Tata.",
      date: new Date("2026-07-20T14:00:00"),
      time: "2:00 PM - 5:00 PM",
      venue: "CSE block seminar room 102",
      bannerImage: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800",
    },
    {
      title: "Tech Innovation & Startup Expo",
      description:
        "Chitkara Innovation Incubator Foundation (CIIF) showcases student projects to alumni angel investors for seed funding support.",
      date: new Date("2026-09-10T09:00:00"),
      time: "9:00 AM - 4:00 PM",
      venue: "Albert Einstein block courtyard",
      bannerImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    },
  ];

  for (const e of events) {
    await prisma.event.create({
      data: { ...e, createdById: admin.id },
    });
  }
  console.log(`✅ Created ${events.length} events`);

  // 5. Seed Announcements (Chitkara updates)
  const announcements = [
    {
      title: "Chitkara Ranked Top 50 in NIRF Rankings 2025",
      content:
        "Chitkara University has secured a stellar position in the National Institutional Ranking Framework (NIRF) 2025 engineering and management tables. Kudos to our hard-working faculty and alumni!",
      category: "ACHIEVEMENT" as const,
    },
    {
      title: "Inauguration of CIIF 2.0 Incubation Lab",
      content:
        "Chitkara Innovation Incubator Foundation has expanded with a state-of-the-art incubation lab to help student founders convert ideas into prototypes. Seed grants of up to INR 5 Lakhs are available.",
      category: "CAMPUS_UPDATE" as const,
    },
    {
      title: "Microsoft & Google Schedule Placement Drives",
      content:
        "Chitkara Career Advancement Cell (CCAC) confirms placement drives by Microsoft and Google for July 2026. Register through ERP and complete mock tests to qualify.",
      category: "PLACEMENT_REPORT" as const,
    },
    {
      title: "ECE Department Hosts IoT Hackathon",
      content:
        "The Electronics department is hosting a 24-hour IoT Hackathon with cash rewards and mentor support from alumni in Intel. Register by Friday.",
      category: "DEPARTMENT_UPDATE" as const,
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({
      data: { ...a, authorId: admin.id },
    });
  }
  console.log(`✅ Created ${announcements.length} announcements`);

  // 6. Mentorship Requests & Chats
  const arjunProfile = students[0].studentProfile!;
  const vikramProfile = alumni[0].alumniProfile!;
  const ananyaProfile = alumni[1].alumniProfile!;

  await prisma.mentorshipRequest.create({
    data: {
      studentId: arjunProfile.id,
      alumniId: vikramProfile.id,
      motivation: "I am a CSE student looking to specialize in backend system design. I admire your work at Google and would love your guidance.",
      careerGoal: "Become a software engineer at a cloud scale company.",
      expectations: "System design reviews and advice on structuring algorithms.",
      status: "ACCEPTED",
    },
  });

  await prisma.mentorshipRequest.create({
    data: {
      studentId: arjunProfile.id,
      alumniId: ananyaProfile.id,
      motivation: "Keen to explore product management and transition from technical developer roles.",
      careerGoal: "Technical Product Manager at Microsoft.",
      expectations: "Resume review and mock interview tips.",
      status: "PENDING",
    },
  });

  // Mentorship Setup with Conversation
  const mentorship = await prisma.mentorship.create({
    data: {
      studentId: arjunProfile.id,
      alumniId: vikramProfile.id,
      isActive: true,
      conversation: { create: {} },
    },
    include: { conversation: true },
  });

  if (mentorship.conversation) {
    await prisma.message.createMany({
      data: [
        {
          conversationId: mentorship.conversation.id,
          senderId: students[0].id,
          content: "Hello Vikram! I am honored to be connected with you. Thanks for accepting my mentorship request.",
          isRead: true,
          readAt: new Date(),
        },
        {
          conversationId: mentorship.conversation.id,
          senderId: alumni[0].id,
          content: "Hi Arjun! Glad to connect. I read your profile, you've got great interests in systems. Let's schedule a Zoom call this Saturday.",
          isRead: false,
        },
      ],
    });
  }
  console.log("✅ Created mentorship connections and mock chat logs");

  // 7. Community Channels
  const broadcast = await prisma.adminBroadcast.create({
    data: {
      title: "Welcome to Chitkara Alumni Network Portal",
      content:
        "This official portal connects current students with Chitkara alumni across the globe. Join mentorship programs, explore events, and stay updated.",
      mode: "COMMUNITY",
      authorId: admin.id,
      isActive: true,
    },
  });

  await prisma.communityMessage.create({
    data: {
      broadcastId: broadcast.id,
      authorId: alumni[0].id,
      content: "Chitkara Alumni here! Really glad to see this platform launch. Current students, feel free to drop any questions regarding engineering career tracks.",
    },
  });
  console.log("✅ Seeded community broadcast message");

  console.log("\n🎉 Seeding Completed Successfully!");
  console.log("📋 Credentials summary:");
  console.log(`   Admin:   ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
  console.log("   Student: arjun.sharma@chitkara.edu.in / Student@123");
  console.log("   Alumni:  vikram.singh@google.com / Alumni@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
