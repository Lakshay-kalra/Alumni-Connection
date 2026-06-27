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
  console.log("🌱 Seeding database...");

  // Admin
  const adminPasswordHash = await hashPassword(DEFAULT_ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {},
    create: {
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Students
  const studentData = [
    {
      email: "student1@college.edu",
      name: "Arjun Sharma",
      department: "Computer Science",
      batch: "2026",
      careerGoals: ["Software Engineer", "Full Stack Developer"],
      interests: ["Web Development", "AI", "Open Source"],
    },
    {
      email: "student2@college.edu",
      name: "Priya Patel",
      department: "Electronics",
      batch: "2027",
      careerGoals: ["Hardware Engineer", "IoT Specialist"],
      interests: ["Embedded Systems", "Robotics"],
    },
    {
      email: "student3@college.edu",
      name: "Rahul Verma",
      department: "Computer Science",
      batch: "2026",
      careerGoals: ["Data Scientist", "ML Engineer"],
      interests: ["Machine Learning", "Data Analytics"],
    },
  ];

  const students = [];
  for (const s of studentData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: await hashPassword("Student@123"),
        role: "STUDENT",
        emailVerified: new Date(),
        studentProfile: {
          create: {
            name: s.name,
            department: s.department,
            batch: s.batch,
            careerGoals: s.careerGoals,
            interests: s.interests,
          },
        },
      },
      include: { studentProfile: true },
    });
    students.push(user);
  }
  console.log(`✅ Created ${students.length} students`);

  // Alumni
  const alumniData = [
    {
      email: "alumni1@company.com",
      name: "Vikram Singh",
      batch: "2018",
      department: "Computer Science",
      company: "Google",
      position: "Senior Software Engineer",
      yearsExperience: 6,
      industry: "Technology",
      location: "Bangalore, India",
      skills: ["JavaScript", "Python", "System Design"],
      expertise: ["Backend Development", "Cloud Architecture"],
      interests: ["Mentorship", "Startups"],
      verified: true,
    },
    {
      email: "alumni2@company.com",
      name: "Ananya Reddy",
      batch: "2019",
      department: "Computer Science",
      company: "Microsoft",
      position: "Product Manager",
      yearsExperience: 5,
      industry: "Technology",
      location: "Hyderabad, India",
      skills: ["Product Strategy", "Agile", "UX"],
      expertise: ["Product Management", "Leadership"],
      interests: ["Product Design", "Career Guidance"],
      verified: true,
    },
    {
      email: "alumni3@company.com",
      name: "Karthik Nair",
      batch: "2020",
      department: "Electronics",
      company: "Intel",
      position: "Hardware Engineer",
      yearsExperience: 4,
      industry: "Semiconductors",
      location: "Pune, India",
      skills: ["VLSI", "Embedded C", "FPGA"],
      expertise: ["Hardware Design", "IoT"],
      interests: ["Electronics", "Research"],
      verified: true,
    },
    {
      email: "alumni4@company.com",
      name: "Meera Joshi",
      batch: "2017",
      department: "Computer Science",
      company: "Amazon",
      position: "Data Scientist",
      yearsExperience: 7,
      industry: "E-commerce",
      location: "Mumbai, India",
      skills: ["Python", "TensorFlow", "SQL"],
      expertise: ["Machine Learning", "Data Science"],
      interests: ["AI Research", "Teaching"],
      verified: true,
    },
    {
      email: "alumni5@company.com",
      name: "Sanjay Kumar",
      batch: "2021",
      department: "Mechanical",
      company: "Tesla",
      position: "Design Engineer",
      yearsExperience: 3,
      industry: "Automotive",
      location: "California, USA",
      skills: ["CAD", "Simulation", "Manufacturing"],
      expertise: ["Automotive Design"],
      interests: ["EV Technology"],
      verified: false,
    },
  ];

  const alumni = [];
  for (const a of alumniData) {
    const user = await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
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
            linkedin: `https://linkedin.com/in/${a.name.toLowerCase().replace(" ", "-")}`,
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

  // Events
  const events = [
    {
      title: "Annual Alumni Meet 2026",
      description:
        "Join us for the biggest alumni gathering of the year. Network, reconnect, and celebrate achievements.",
      date: new Date("2026-08-15T10:00:00"),
      time: "10:00 AM - 6:00 PM",
      venue: "Main Auditorium, Campus",
      bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
    },
    {
      title: "Tech Talk: AI in Industry",
      description:
        "Industry leaders discuss the future of AI and career opportunities for graduates.",
      date: new Date("2026-07-20T14:00:00"),
      time: "2:00 PM - 5:00 PM",
      venue: "Seminar Hall B",
      bannerImage: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    },
    {
      title: "Career Fair 2026",
      description:
        "Connect with top companies and explore internship and job opportunities.",
      date: new Date("2026-09-10T09:00:00"),
      time: "9:00 AM - 4:00 PM",
      venue: "Sports Complex",
      bannerImage: "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800",
    },
  ];

  for (const e of events) {
    await prisma.event.create({
      data: { ...e, createdById: admin.id },
    });
  }
  console.log(`✅ Created ${events.length} events`);

  // Announcements
  const announcements = [
    {
      title: "Record Placement Season 2025",
      content:
        "Our college achieved a record 95% placement rate this season with top packages from leading tech companies.",
      category: "PLACEMENT_REPORT" as const,
    },
    {
      title: "New Research Lab Inaugurated",
      content:
        "The AI & Robotics Research Lab was inaugurated by the Director. State-of-the-art equipment now available for students.",
      category: "CAMPUS_UPDATE" as const,
    },
    {
      title: "Alumni Startup Raises Series A",
      content:
        "Congratulations to alumnus Rajesh Mehta (Batch 2015) whose startup TechFlow raised $10M in Series A funding.",
      category: "ACHIEVEMENT" as const,
    },
    {
      title: "CS Department Hackathon Winners",
      content:
        "Team CodeCrafters won the inter-department hackathon with their innovative sustainability app.",
      category: "DEPARTMENT_UPDATE" as const,
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({
      data: { ...a, authorId: admin.id },
    });
  }
  console.log(`✅ Created ${announcements.length} announcements`);

  // Mentorship requests
  const student1Profile = students[0].studentProfile!;
  const student2Profile = students[1].studentProfile!;
  const alumni1Profile = alumni[0].alumniProfile!;
  const alumni2Profile = alumni[1].alumniProfile!;
  const alumni3Profile = alumni[2].alumniProfile!;

  await prisma.mentorshipRequest.create({
    data: {
      studentId: student1Profile.id,
      alumniId: alumni1Profile.id,
      motivation: "I admire your career path at Google and want guidance on backend development.",
      careerGoal: "Become a senior software engineer at a top tech company.",
      expectations: "Weekly check-ins and code review guidance.",
      status: "ACCEPTED",
    },
  });

  await prisma.mentorshipRequest.create({
    data: {
      studentId: student1Profile.id,
      alumniId: alumni2Profile.id,
      motivation: "Interested in transitioning from engineering to product management.",
      careerGoal: "Product Manager at a tech startup.",
      expectations: "Career roadmap and interview preparation.",
      status: "PENDING",
    },
  });

  await prisma.mentorshipRequest.create({
    data: {
      studentId: student2Profile.id,
      alumniId: alumni3Profile.id,
      motivation: "Passionate about hardware design and want industry mentorship.",
      careerGoal: "Hardware engineer at a semiconductor company.",
      expectations: "Project guidance and industry insights.",
      status: "PENDING",
    },
  });

  // Active mentorship with conversation
  const mentorship = await prisma.mentorship.create({
    data: {
      studentId: student1Profile.id,
      alumniId: alumni1Profile.id,
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
          content: "Hello! Thank you for accepting my mentorship request.",
          isRead: true,
          readAt: new Date(),
        },
        {
          conversationId: mentorship.conversation.id,
          senderId: alumni[0].id,
          content: "Happy to help! Let's schedule our first session this week.",
          isRead: false,
        },
      ],
    });
  }
  console.log("✅ Created mentorship requests and sample chat");

  // Admin broadcast
  const broadcast = await prisma.adminBroadcast.create({
    data: {
      title: "Welcome to Alumni Network",
      content:
        "Welcome to our new alumni networking platform! Connect, mentor, and grow together.",
      mode: "COMMUNITY",
      authorId: admin.id,
      isActive: true,
    },
  });

  await prisma.communityMessage.create({
    data: {
      broadcastId: broadcast.id,
      authorId: alumni[0].id,
      content: "Excited to be part of this community! Looking forward to mentoring students.",
    },
  });
  console.log("✅ Created community broadcast");

  // Sample notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: students[0].id,
        type: "MENTORSHIP_ACCEPTED",
        title: "Mentorship Accepted",
        message: "Vikram Singh accepted your mentorship request!",
        link: "/student/dashboard",
      },
      {
        userId: alumni[0].id,
        type: "NEW_MESSAGE",
        title: "New Message",
        message: "You have a new message from Arjun Sharma",
        link: "/chat",
      },
      {
        userId: alumni[1].id,
        type: "MENTORSHIP_REQUEST",
        title: "New Mentorship Request",
        message: "Arjun Sharma sent you a mentorship request",
        link: "/alumni/dashboard",
      },
    ],
  });
  console.log("✅ Created sample notifications");

  console.log("\n🎉 Seed completed!");
  console.log("\n📋 Login credentials:");
  console.log(`   Admin:   ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD}`);
  console.log("   Student: student1@college.edu / Student@123");
  console.log("   Alumni:  alumni1@company.com / Alumni@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
