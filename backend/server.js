import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFParse } from "pdf-parse";

const app = express();
const PORT = 5003;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isAllowed =
      file.mimetype === "application/pdf" ||
      file.mimetype === "text/plain" ||
      file.originalname.toLowerCase().endsWith(".pdf") ||
      file.originalname.toLowerCase().endsWith(".txt");

    cb(isAllowed ? null : new Error("Only PDF and TXT resumes are supported."), isAllowed);
  }
});

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

const roleProfiles = [
  {
    keywords: ["software", "developer", "engineer", "frontend", "backend", "full stack", "fullstack"],
    missingSkills: ["Git", "React", "APIs", "Database", "DSA"],
    companies: ["TCS", "Infosys", "Wipro", "Accenture", "Cognizant", "Tech Mahindra"],
    roleTitle: "Software Developer",
    prompts: [
      "Tell me about yourself.",
      "Explain one project you built.",
      "What is an API?",
      "Difference between frontend and backend?",
      "What is Git and GitHub?",
      "How do you debug an error?",
      "Why should we hire you?"
    ]
  },
  {
    keywords: ["sales", "marketing", "business development", "bd", "growth"],
    missingSkills: ["CRM", "Communication", "Lead generation", "Negotiation"],
    companies: ["Byju's", "HDFC Life", "Kotak Life", "Quess Corp", "Justdial", "IndiaMART"],
    roleTitle: "Sales and Marketing Associate",
    prompts: [
      "Tell me about yourself.",
      "How would you generate leads for a new product?",
      "How do you handle rejection from a prospect?",
      "What CRM tools have you used or learned?",
      "How would you convince a customer to take a demo?",
      "Describe a time you communicated clearly under pressure.",
      "Why should we hire you?"
    ]
  },
  {
    keywords: ["data", "ai", "ml", "machine learning", "analyst", "analytics"],
    missingSkills: ["Python", "Pandas", "ML algorithms", "SQL", "Model evaluation"],
    companies: ["TCS", "Accenture", "Fractal", "Mu Sigma", "Tiger Analytics", "LatentView Analytics"],
    roleTitle: "Data / AI Associate",
    prompts: [
      "Tell me about yourself.",
      "Explain one data or AI project you built.",
      "What is the difference between supervised and unsupervised learning?",
      "How do you clean a messy dataset?",
      "What SQL concepts are important for analytics?",
      "How do you evaluate a machine learning model?",
      "Why should we hire you?"
    ]
  },
  {
    keywords: ["video", "editor", "content", "creator", "motion"],
    missingSkills: ["Premiere Pro", "After Effects", "Storytelling", "Thumbnails", "Retention"],
    companies: ["Pocket Aces", "Schbang", "WATConsult", "The Viral Fever", "White Rivers Media", "Content Whale"],
    roleTitle: "Video Editor / Content Creator",
    prompts: [
      "Tell me about yourself.",
      "Show one content project you are proud of.",
      "How do you improve viewer retention?",
      "What makes a strong thumbnail?",
      "How do you plan a video edit from raw footage?",
      "Which editing tools do you use most confidently?",
      "Why should we hire you?"
    ]
  }
];

const defaultProfile = {
  missingSkills: ["Communication", "Problem solving", "Portfolio projects", "Interview preparation", "Industry tools"],
  companies: ["TCS", "Accenture", "Quess Corp", "Naukri", "TeamLease", "Apna"],
  roleTitle: "Entry-Level Associate",
  prompts: [
    "Tell me about yourself.",
    "Why are you interested in this role?",
    "Explain one project or achievement from your resume.",
    "What are your strongest skills?",
    "How do you learn something new quickly?",
    "Describe a challenge you solved.",
    "Why should we hire you?"
  ]
};

function getRoleProfile(role = "") {
  const normalizedRole = role.toLowerCase();
  return roleProfiles.find((profile) =>
    profile.keywords.some((keyword) => normalizedRole.includes(keyword))
  ) || defaultProfile;
}

function splitSkills(skills = "") {
  return skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function buildLinkedInUrl(role, location) {
  return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role || "Jobs")}&location=${encodeURIComponent(location || "India")}`;
}

function calculateResumeScore({ name, role, skills, summary, location }) {
  const cues = [];
  let score = 0;
  const skillList = splitSkills(skills);

  if (name.trim()) {
    score += 20;
    cues.push("Name is present, so recruiters can identify the candidate quickly. (+20)");
  } else {
    cues.push("Name is missing. Add it to improve recruiter clarity. (+0)");
  }

  if (role.trim()) {
    score += 20;
    cues.push("Target role is clear and helps tailor the resume. (+20)");
  } else {
    cues.push("Target role is missing. Add a specific role title. (+0)");
  }

  if (skillList.length >= 3) {
    score += 25;
    cues.push("Skills section has 3 or more skills, showing role readiness. (+25)");
  } else {
    cues.push("Skills section needs at least 3 skills for a stronger profile. (+0)");
  }

  if (summary.trim().length > 40) {
    score += 20;
    cues.push("Resume summary is detailed enough to explain the candidate profile. (+20)");
  } else {
    cues.push("Resume summary is too short. Add education, projects, or achievements. (+0)");
  }

  if (location.trim()) {
    score += 15;
    cues.push("Location is present, which helps match hiring opportunities. (+15)");
  } else {
    cues.push("Location is missing. Add city or preferred work location. (+0)");
  }

  return { score, cues };
}

function buildSuggestions({ name, role, skills, summary }) {
  const skillList = splitSkills(skills);
  const hasMetrics = /\d|%|increase|reduced|improved|growth/i.test(summary);

  return [
    `Use a clear resume headline such as "${role || "Target Role"} candidate with practical project experience."`,
    hasMetrics
      ? "Keep measurable achievements visible near the top of the resume."
      : "Add measurable proof, such as project count, performance improvement, sales growth, or audience reach.",
    skillList.length
      ? `Group your strongest skills near the top: ${skillList.slice(0, 5).join(", ")}.`
      : "Add a dedicated skills section with tools, frameworks, and role-specific strengths.",
    `Add one project or achievement that proves readiness for a ${role || "target"} role.`,
    `${name || "The candidate"} should write resume bullets with action verbs like built, improved, analyzed, created, or managed.`
  ];
}

function buildSelfIntro({ name, role, skills, summary, location }) {
  const cleanName = name.trim() || "I";
  const targetRole = role.trim() || "my target role";
  const skillText = skills.trim() || "relevant technical and workplace skills";
  const locationText = location.trim() ? ` in ${location.trim()}` : "";
  const cleanSummary = summary.trim();
  const punctuatedSummary = cleanSummary && /[.!?]$/.test(cleanSummary) ? cleanSummary : `${cleanSummary}.`;
  const summaryText = cleanSummary
    ? ` My background includes ${punctuatedSummary}`
    : " I enjoy learning quickly, solving practical problems, and contributing to team goals.";

  return `Hi, my name is ${cleanName}. I am preparing for a ${targetRole} opportunity${locationText}. I bring skills in ${skillText}.${summaryText} I am looking for a role where I can apply my strengths, keep improving, and contribute from day one.`;
}

function buildCompanyLeads(profile, role, location) {
  const targetRole = role.trim() || profile.roleTitle;
  const targetLocation = location.trim() || "India";
  const jobTypes = ["Full-time", "Entry-level", "Hybrid", "On-site", "Internship", "Graduate role"];
  const linkedinUrl = buildLinkedInUrl(targetRole, targetLocation);

  return profile.companies.slice(0, 6).map((companyName, index) => ({
    companyName,
    roleTitle: targetRole,
    location: targetLocation,
    jobType: jobTypes[index % jobTypes.length],
    reasonToApply: `${companyName} is worth exploring for ${targetRole} roles because it offers hiring opportunities where practical skills, communication, and interview readiness can stand out.`,
    linkedinUrl
  }));
}

function hasKeyword(text, keyword) {
  return new RegExp(`\\b${keyword}\\b`, "i").test(text);
}

function detectName(text) {
  const firstLine = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.includes("@") && !/\d{6,}/.test(line));

  return Boolean(firstLine && /^[a-zA-Z .'-]{3,60}$/.test(firstLine));
}

function createImprovedSummary(text) {
  const compactText = text.replace(/\s+/g, " ").trim();
  const roleHint = /developer|react|javascript|python|api|frontend|backend/i.test(text)
    ? "software development"
    : /sales|marketing|lead|customer|crm/i.test(text)
      ? "sales and marketing"
      : "career";
  const projectHint = hasKeyword(text, "projects") || /built|developed|created/i.test(text)
    ? "hands-on project experience"
    : "a foundation of academic and practical learning";
  const skillHint = compactText.slice(0, 140);

  return `Motivated ${roleHint} candidate with ${projectHint}. Skilled at learning quickly, solving practical problems, and communicating clearly with teams. Brings relevant strengths from the resume including ${skillHint || "technical, analytical, and workplace skills"}. Ready to contribute to entry-level roles while continuing to grow professionally.`;
}

function analyzeResumeText(text) {
  const normalized = text.toLowerCase();
  const hasEmail = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);
  const hasPhone = /(?:\+?\d{1,3}[-.\s]?)?(?:\d[-.\s]?){9,12}/.test(text);
  const hasName = detectName(text);
  const hasSkills = hasKeyword(normalized, "skills");
  const hasProjects = hasKeyword(normalized, "projects") || hasKeyword(normalized, "project");
  const hasEducation = hasKeyword(normalized, "education");
  const hasExperience = hasKeyword(normalized, "experience") || hasKeyword(normalized, "internship");
  const hasTechnicalKeywords = /react|javascript|python|html|css|node|express|api|sql|git|developer/i.test(text);
  const hasMeasurableAchievements = /\d+%|\d+\+|increased|improved|reduced|saved|growth/i.test(text);

  let resumeScore = 0;
  if (hasName) resumeScore += 20;
  if (hasEmail) resumeScore += 15;
  if (hasPhone) resumeScore += 10;
  if (hasSkills) resumeScore += 15;
  if (hasProjects) resumeScore += 15;
  if (hasEducation) resumeScore += 10;
  if (hasExperience) resumeScore += 15;
  resumeScore = Math.min(resumeScore, 100);

  const sectionCount = [hasSkills, hasProjects, hasEducation, hasExperience].filter(Boolean).length;
  const strengths = [];
  const weaknesses = [];
  const missingSections = [];
  const skillSuggestions = [];

  if (sectionCount >= 3) strengths.push("Resume includes multiple important sections.");
  if (hasTechnicalKeywords) strengths.push("Resume contains technical keywords relevant to hiring filters.");
  if (hasProjects) strengths.push("Project mentions help prove practical experience.");
  if (hasEmail) strengths.push("Email contact is easy for recruiters to find.");
  if (!strengths.length) strengths.push("Resume has a starting structure that can be improved with clearer sections.");

  if (text.trim().length < 450) weaknesses.push("Resume content appears short and may need more detail.");
  if (sectionCount < 3) weaknesses.push("Resume is missing some core sections recruiters expect.");
  if (!hasMeasurableAchievements) weaknesses.push("Resume does not show measurable achievements yet.");
  if (!hasPhone) weaknesses.push("Phone number is missing or hard to detect.");

  if (!hasSkills) missingSections.push("Add a Skills section.");
  if (!hasProjects) missingSections.push("Add a Projects section with 2-3 practical examples.");
  if (!hasEducation) missingSections.push("Add an Education section.");
  if (!hasExperience) missingSections.push("Add an Experience or Internships section.");
  if (!missingSections.length) missingSections.push("No major resume sections are missing.");

  if (/developer|react|javascript|frontend|backend|software|api/i.test(text)) {
    skillSuggestions.push("React", "Git", "APIs");
  } else if (/sales|marketing|lead|customer|crm/i.test(text)) {
    skillSuggestions.push("CRM", "Communication", "Negotiation");
  } else {
    skillSuggestions.push("Communication", "Problem solving", "Role-specific tools");
  }

  return {
    resumeScore,
    strengths,
    weaknesses,
    missingSections,
    skillSuggestions,
    keywordSuggestions: [
      "Add action words such as built, developed, improved, and increased.",
      "Include keywords from the target job role.",
      "Mention tools, frameworks, and measurable outcomes where possible."
    ],
    atsTips: [
      "Use bullet points for projects, education, and experience.",
      "Avoid long paragraphs that are hard for ATS systems to scan.",
      "Add keywords from the job description naturally throughout the resume.",
      "Use simple section headings like Skills, Projects, Education, and Experience."
    ],
    improvedSummary: createImprovedSummary(text)
  };
}

async function extractResumeText(file) {
  if (!file) {
    throw new Error("File is required.");
  }

  if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
    const parser = new PDFParse({ data: file.buffer });
    const parsed = await parser.getText();
    return parsed.text;
  }

  if (file.mimetype === "text/plain" || file.originalname.toLowerCase().endsWith(".txt")) {
    return file.buffer.toString("utf8");
  }

  throw new Error("Unsupported file type.");
}

function splitBuilderList(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeEntries(entries) {
  return Array.isArray(entries) ? entries.filter((entry) => Object.values(entry || {}).some(Boolean)) : [];
}

function improveBuilderSummary(summary = "", role = "") {
  const cleanSummary = summary.trim();

  if (cleanSummary.length >= 80) {
    return cleanSummary;
  }

  const targetRole = role?.trim() || "entry-level professional";
  return `Motivated ${targetRole} with a strong foundation in practical learning, problem solving, and teamwork. Skilled at building projects, communicating clearly, and improving through feedback. Ready to contribute to real workplace goals while continuing to grow professionally.`;
}

function buildResumePayload(data = {}) {
  const personal = data.personal || {};
  const career = data.career || {};
  const education = data.education || {};
  const skills = data.skills || {};
  const projects = normalizeEntries(data.projects);
  const experience = normalizeEntries(data.experience);
  const certifications = normalizeEntries(data.certifications);
  const technicalSkills = splitBuilderList(skills.technical);
  const softSkills = splitBuilderList(skills.soft);
  const summary = improveBuilderSummary(career.summary, career.role);
  const contactItems = [personal.email, personal.phone, personal.location, personal.linkedin, personal.portfolio].filter(Boolean);
  const improvementTips = [];

  if (!personal.fullName?.trim()) improvementTips.push("Add your full name at the top of the resume.");
  if (!personal.email?.trim()) improvementTips.push("Add a professional email address.");
  if (!personal.phone?.trim()) improvementTips.push("Add a phone number so recruiters can contact you quickly.");
  if (!career.role?.trim()) improvementTips.push("Add a target role to make the resume more focused.");
  if (!career.summary?.trim() || career.summary.trim().length < 80) improvementTips.push("Expand the professional summary with role, strengths, and career goal.");
  if (!technicalSkills.length) improvementTips.push("Add technical skills relevant to your target role.");
  if (!projects.length) improvementTips.push("Add at least one project with tech stack, description, and link.");
  if (!experience.length) improvementTips.push("Add internship, freelance, volunteer, or academic experience if available.");
  if (!certifications.length) improvementTips.push("Add certifications to show continuous learning.");

  const header = {
    name: personal.fullName?.trim() || "Your Name",
    contact: contactItems.join(" | ")
  };

  const sectionLines = {
    header: `${header.name}\n${header.contact}`,
    summary,
    skills: [
      technicalSkills.length ? `Technical: ${technicalSkills.join(", ")}` : "",
      softSkills.length ? `Soft: ${softSkills.join(", ")}` : ""
    ].filter(Boolean).join("\n"),
    education: [
      education.degree,
      education.college,
      education.graduationYear ? `Graduation: ${education.graduationYear}` : "",
      education.cgpa ? `CGPA/Percentage: ${education.cgpa}` : ""
    ].filter(Boolean).join(" | "),
    projects: projects.map((project) => {
      const title = project.name || "Project";
      const stack = project.techStack ? ` (${project.techStack})` : "";
      const description = project.description || "Developed a practical project using relevant tools and structured problem solving.";
      const link = project.link ? `\n  Link: ${project.link}` : "";
      return `${title}${stack}\n  Built ${description}${link}`;
    }).join("\n\n"),
    experience: experience.map((item) => {
      const title = [item.role, item.company].filter(Boolean).join(" - ") || "Experience";
      const duration = item.duration ? ` | ${item.duration}` : "";
      const responsibilities = item.responsibilities || "Managed responsibilities, improved workflows, and contributed to team goals.";
      return `${title}${duration}\n  Developed and managed ${responsibilities}`;
    }).join("\n\n"),
    certifications: certifications.map((cert) => {
      return [cert.name, cert.platform, cert.year].filter(Boolean).join(" | ");
    }).join("\n")
  };

  const resumeText = [
    sectionLines.header,
    "",
    "PROFESSIONAL SUMMARY",
    sectionLines.summary,
    "",
    "SKILLS",
    sectionLines.skills,
    "",
    "EDUCATION",
    sectionLines.education,
    "",
    "PROJECTS",
    sectionLines.projects,
    "",
    "EXPERIENCE / INTERNSHIP",
    sectionLines.experience,
    "",
    "CERTIFICATIONS",
    sectionLines.certifications
  ].filter((line) => line !== undefined).join("\n");

  return {
    resumeText,
    resumeSections: {
      header,
      summary: sectionLines.summary,
      skills: {
        technical: technicalSkills,
        soft: softSkills
      },
      education,
      projects,
      experience,
      certifications
    },
    improvementTips
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ message: "HireReady AI backend running" });
});

app.post("/api/analyze", (req, res) => {
  try {
    const { name = "", role = "", skills = "", summary = "", location = "" } = req.body || {};

    if (!role.trim()) {
      return res.status(400).json({ message: "Target role is required." });
    }

    const profile = getRoleProfile(role);
    const resume = calculateResumeScore({ name, role, skills, summary, location });
    const linkedinSearchUrl = buildLinkedInUrl(role, location);

    return res.json({
      resumeScore: resume.score,
      scoreCues: resume.cues,
      suggestions: buildSuggestions({ name, role, skills, summary }),
      missingSkills: profile.missingSkills,
      interviewPrompts: profile.prompts,
      selfIntro: buildSelfIntro({ name, role, skills, summary, location }),
      companyLeads: buildCompanyLeads(profile, role, location),
      linkedinSearchUrl
    });
  } catch (error) {
    console.error("Analyze route error:", error);
    return res.status(500).json({ message: "Unable to analyze profile right now." });
  }
});

app.post("/api/resume/analyze", (req, res) => {
  upload.single("resume")(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({ message: uploadError.message || "Could not read file" });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: "Please upload a PDF or TXT resume." });
      }

      const text = await extractResumeText(req.file);

      if (!text || text.trim().length < 20) {
        return res.status(400).json({ message: "Could not read file" });
      }

      return res.json(analyzeResumeText(text));
    } catch (error) {
      console.error("Resume analysis error:", error);
      return res.status(400).json({ message: "Could not read file" });
    }
  });
});

app.post("/api/resume/build", (req, res) => {
  try {
    return res.json(buildResumePayload(req.body || {}));
  } catch (error) {
    console.error("Resume build error:", error);
    return res.status(500).json({ message: "Unable to build resume right now." });
  }
});

app.listen(PORT, () => {
  console.log(`HireReady AI backend running on http://localhost:${PORT}`);
});
