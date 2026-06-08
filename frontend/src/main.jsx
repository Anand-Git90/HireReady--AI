import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  Clipboard,
  Download,
  FileText,
  Gauge,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound
} from "lucide-react";
import "./styles.css";

const API_URL = "/api/analyze";
const RESUME_API_URL = "/api/resume/analyze";
const RESUME_BUILD_API_URL = "/api/resume/build";

const initialForm = {
  name: "",
  role: "",
  skills: "",
  summary: "",
  location: ""
};

const emptyProject = { name: "", techStack: "", description: "", link: "" };
const emptyExperience = { company: "", role: "", duration: "", responsibilities: "" };
const emptyCertification = { name: "", platform: "", year: "" };

const initialBuilderForm = {
  personal: {
    fullName: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    portfolio: ""
  },
  career: {
    role: "",
    summary: ""
  },
  education: {
    degree: "",
    college: "",
    graduationYear: "",
    cgpa: ""
  },
  skills: {
    technical: "",
    soft: ""
  },
  projects: [{ ...emptyProject }],
  experience: [{ ...emptyExperience }],
  certifications: [{ ...emptyCertification }]
};

function normalizeAnalyzeResponse(data) {
  const companyLeads =
    data?.companyLeads ||
    data?.companies ||
    data?.companiesHiring?.companies ||
    [];

  return {
    ...data,
    resumeScore: data?.resumeScore ?? 0,
    scoreCues: data?.scoreCues || data?.resumeScoreCues || [],
    suggestions: data?.suggestions || data?.resumeSuggestions || [],
    missingSkills: data?.missingSkills || [],
    interviewPrompts: data?.interviewPrompts || data?.interviewQuestions || [],
    selfIntro: data?.selfIntro || data?.selfIntroduction || "",
    companyLeads: companyLeads.map((company) => ({
      ...company,
      linkedinUrl:
        company.linkedinUrl ||
        data?.linkedinSearchUrl ||
        data?.companiesHiring?.linkedinSearchUrl ||
        "#"
    })),
    linkedinSearchUrl: data?.linkedinSearchUrl || data?.companiesHiring?.linkedinSearchUrl || "#"
  };
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeResults, setResumeResults] = useState(null);
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [builderForm, setBuilderForm] = useState(initialBuilderForm);
  const [builderResults, setBuilderResults] = useState(null);
  const [builderLoading, setBuilderLoading] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const [resumeCopied, setResumeCopied] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setCopied(false);
    setResults(null);

    if (!form.role.trim()) {
      setError("Please enter a target role before analyzing.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await axios.post(API_URL, form);

      console.log("ANALYZE RESPONSE:", data);
      setResults(normalizeAnalyzeResponse(data));
    } catch (err) {
      console.error("Analyze Profile failed:", err);
      setError(err.response?.data?.message || err.message || "Unable to connect to the HireReady AI backend. Check that port 5003 is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyIntro = async () => {
    if (!results?.selfIntro) return;
    await navigator.clipboard.writeText(results.selfIntro);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleReset = () => {
    setForm(initialForm);
    setResults(null);
    setError("");
    setCopied(false);
  };

  const handleResumeUpload = async (event) => {
    event.preventDefault();
    setResumeError("");
    setResumeResults(null);
    setSummaryCopied(false);

    if (!resumeFile) {
      setResumeError("Please upload a PDF or TXT resume.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resumeFile);
    setResumeLoading(true);

    try {
      const { data } = await axios.post(RESUME_API_URL, formData);

      console.log("RESUME ANALYZE RESPONSE:", data);
      setResumeResults(data);
    } catch (err) {
      console.error("Resume upload failed:", err);
      setResumeError(err.response?.data?.message || err.message || "Could not read file");
    } finally {
      setResumeLoading(false);
    }
  };

  const handleCopyImprovedSummary = async () => {
    if (!resumeResults?.improvedSummary) return;
    await navigator.clipboard.writeText(resumeResults.improvedSummary);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 1800);
  };

  const updateBuilderField = (section, field, value) => {
    setBuilderForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value
      }
    }));
  };

  const updateBuilderEntry = (section, index, field, value) => {
    setBuilderForm((current) => ({
      ...current,
      [section]: current[section].map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const addBuilderEntry = (section, emptyEntry) => {
    setBuilderForm((current) => ({
      ...current,
      [section]: [...current[section], { ...emptyEntry }]
    }));
  };

  const removeBuilderEntry = (section, index) => {
    setBuilderForm((current) => ({
      ...current,
      [section]: current[section].filter((_, entryIndex) => entryIndex !== index)
    }));
  };

  const handleBuildResume = async (event) => {
    event.preventDefault();
    setBuilderError("");
    setResumeCopied(false);
    setBuilderLoading(true);

    try {
      const { data } = await axios.post(RESUME_BUILD_API_URL, builderForm);
      console.log("RESUME BUILD RESPONSE:", data);
      setBuilderResults(data);
    } catch (err) {
      console.error("Resume build failed:", err);
      setBuilderError(err.response?.data?.message || err.message || "Unable to build resume right now.");
    } finally {
      setBuilderLoading(false);
    }
  };

  const handleCopyResumeText = async () => {
    if (!builderResults?.resumeText) return;
    await navigator.clipboard.writeText(builderResults.resumeText);
    setResumeCopied(true);
    setTimeout(() => setResumeCopied(false), 1800);
  };

  const handleDownloadResume = () => {
    if (!builderResults?.resumeText) return;
    const blob = new Blob([builderResults.resumeText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${builderForm.personal.fullName || "HireReady-Resume"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleResetBuilder = () => {
    setBuilderForm(initialBuilderForm);
    setBuilderResults(null);
    setBuilderError("");
    setResumeCopied(false);
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} />
            Career preparation platform
          </span>
          <h1>HireReady AI</h1>
          <p>Prepare your resume, interview answers, and job search in one place.</p>
        </div>
        <div className="hero-panel" aria-label="Preparation highlights">
          <div>
            <FileText />
            <span>Resume score cues</span>
          </div>
          <div>
            <MessageSquareText />
            <span>Interview prompts</span>
          </div>
          <div>
            <BriefcaseBusiness />
            <span>Hiring company leads</span>
          </div>
        </div>
      </section>

      <section className="upload-section">
        <form className="input-card upload-card" onSubmit={handleResumeUpload}>
          <div className="section-heading">
            <Upload />
            <div>
              <h2>Resume Upload</h2>
              <p>Upload a PDF or TXT resume for rule-based ATS and content analysis.</p>
            </div>
          </div>

          <label>
            Resume File
            <input
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
            />
          </label>

          {resumeError && <div className="error-message">{resumeError}</div>}

          <button className="primary-button upload-button" type="submit" disabled={resumeLoading}>
            {resumeLoading ? <Loader2 className="spin" size={18} /> : <Upload size={18} />}
            {resumeLoading ? "Analyzing Resume..." : "Upload & Analyze Resume"}
          </button>
        </form>

        <ResumeAnalysisResults
          results={resumeResults}
          copied={summaryCopied}
          onCopySummary={handleCopyImprovedSummary}
        />
      </section>

      <section className="builder-section" id="auto-resume-builder">
        <ResumeBuilderForm
          form={builderForm}
          loading={builderLoading}
          error={builderError}
          onSubmit={handleBuildResume}
          onFieldChange={updateBuilderField}
          onEntryChange={updateBuilderEntry}
          onAddEntry={addBuilderEntry}
          onRemoveEntry={removeBuilderEntry}
          onReset={handleResetBuilder}
        />

        <ResumeBuilderPreview
          results={builderResults}
          copied={resumeCopied}
          onCopy={handleCopyResumeText}
          onDownload={handleDownloadResume}
        />
      </section>

      <section className="workspace">
        <form className="input-card" onSubmit={handleSubmit}>
          <div className="section-heading">
            <UserRound />
            <div>
              <h2>Candidate Details</h2>
              <p>Enter your target job details to generate a focused preparation pack.</p>
            </div>
          </div>

          <div className="field-grid">
            <label>
              Name
              <input name="name" value={form.name} onChange={handleChange} placeholder="Ankit Sharma" />
            </label>
            <label>
              Target Role
              <input name="role" value={form.role} onChange={handleChange} placeholder="Software Developer" />
            </label>
            <label>
              Skills
              <input name="skills" value={form.skills} onChange={handleChange} placeholder="HTML, CSS, React, JavaScript" />
            </label>
            <label>
              Location
              <input name="location" value={form.location} onChange={handleChange} placeholder="Bengaluru" />
            </label>
          </div>

          <label>
            Resume Summary
            <textarea
              name="summary"
              value={form.summary}
              onChange={handleChange}
              rows="5"
              placeholder="Write a short summary of your education, projects, experience, or goals."
            />
          </label>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
              {loading ? "Analyzing..." : "Analyze Profile"}
            </button>
            <button className="secondary-button" type="button" onClick={handleReset}>
              <RefreshCcw size={18} />
              Reset
            </button>
          </div>
        </form>

        <Results results={results} copied={copied} onCopyIntro={handleCopyIntro} />
      </section>
    </main>
  );
}

function ResumeBuilderForm({
  form,
  loading,
  error,
  onSubmit,
  onFieldChange,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onReset
}) {
  return (
    <form className="input-card builder-form" onSubmit={onSubmit}>
      <div className="section-heading">
        <FileText />
        <div>
          <h2>Auto Resume Builder</h2>
          <p>Enter your details to generate a clean ATS-friendly resume preview.</p>
        </div>
      </div>

      <BuilderSection title="Personal Details">
        <div className="field-grid">
          <TextInput label="Full name" value={form.personal.fullName} onChange={(value) => onFieldChange("personal", "fullName", value)} />
          <TextInput label="Email" value={form.personal.email} onChange={(value) => onFieldChange("personal", "email", value)} />
          <TextInput label="Phone" value={form.personal.phone} onChange={(value) => onFieldChange("personal", "phone", value)} />
          <TextInput label="Location" value={form.personal.location} onChange={(value) => onFieldChange("personal", "location", value)} />
          <TextInput label="LinkedIn" value={form.personal.linkedin} onChange={(value) => onFieldChange("personal", "linkedin", value)} />
          <TextInput label="GitHub / Portfolio" value={form.personal.portfolio} onChange={(value) => onFieldChange("personal", "portfolio", value)} />
        </div>
      </BuilderSection>

      <BuilderSection title="Career Details">
        <TextInput label="Target role" value={form.career.role} onChange={(value) => onFieldChange("career", "role", value)} />
        <label>
          Professional summary
          <textarea value={form.career.summary} onChange={(event) => onFieldChange("career", "summary", event.target.value)} rows="4" placeholder="Briefly describe your strengths, projects, and career goal." />
        </label>
      </BuilderSection>

      <BuilderSection title="Education">
        <div className="field-grid">
          <TextInput label="Degree" value={form.education.degree} onChange={(value) => onFieldChange("education", "degree", value)} />
          <TextInput label="College/University" value={form.education.college} onChange={(value) => onFieldChange("education", "college", value)} />
          <TextInput label="Graduation year" value={form.education.graduationYear} onChange={(value) => onFieldChange("education", "graduationYear", value)} />
          <TextInput label="CGPA/percentage" value={form.education.cgpa} onChange={(value) => onFieldChange("education", "cgpa", value)} />
        </div>
      </BuilderSection>

      <BuilderSection title="Skills">
        <TextInput label="Technical skills" value={form.skills.technical} onChange={(value) => onFieldChange("skills", "technical", value)} placeholder="React, Node.js, SQL" />
        <TextInput label="Soft skills" value={form.skills.soft} onChange={(value) => onFieldChange("skills", "soft", value)} placeholder="Communication, teamwork, leadership" />
      </BuilderSection>

      <DynamicBuilderSection title="Projects" addLabel="Add project" onAdd={() => onAddEntry("projects", emptyProject)}>
        {form.projects.map((project, index) => (
          <div className="builder-entry" key={`project-${index}`}>
            <EntryHeader title={`Project ${index + 1}`} onRemove={() => onRemoveEntry("projects", index)} removable={form.projects.length > 1} />
            <TextInput label="Project name" value={project.name} onChange={(value) => onEntryChange("projects", index, "name", value)} />
            <TextInput label="Tech stack" value={project.techStack} onChange={(value) => onEntryChange("projects", index, "techStack", value)} />
            <TextInput label="Description" value={project.description} onChange={(value) => onEntryChange("projects", index, "description", value)} />
            <TextInput label="Project link" value={project.link} onChange={(value) => onEntryChange("projects", index, "link", value)} />
          </div>
        ))}
      </DynamicBuilderSection>

      <DynamicBuilderSection title="Experience / Internship" addLabel="Add experience" onAdd={() => onAddEntry("experience", emptyExperience)}>
        {form.experience.map((item, index) => (
          <div className="builder-entry" key={`experience-${index}`}>
            <EntryHeader title={`Experience ${index + 1}`} onRemove={() => onRemoveEntry("experience", index)} removable={form.experience.length > 1} />
            <TextInput label="Company name" value={item.company} onChange={(value) => onEntryChange("experience", index, "company", value)} />
            <TextInput label="Role" value={item.role} onChange={(value) => onEntryChange("experience", index, "role", value)} />
            <TextInput label="Duration" value={item.duration} onChange={(value) => onEntryChange("experience", index, "duration", value)} />
            <TextInput label="Responsibilities" value={item.responsibilities} onChange={(value) => onEntryChange("experience", index, "responsibilities", value)} />
          </div>
        ))}
      </DynamicBuilderSection>

      <DynamicBuilderSection title="Certifications" addLabel="Add certification" onAdd={() => onAddEntry("certifications", emptyCertification)}>
        {form.certifications.map((cert, index) => (
          <div className="builder-entry" key={`certification-${index}`}>
            <EntryHeader title={`Certification ${index + 1}`} onRemove={() => onRemoveEntry("certifications", index)} removable={form.certifications.length > 1} />
            <TextInput label="Certificate name" value={cert.name} onChange={(value) => onEntryChange("certifications", index, "name", value)} />
            <TextInput label="Platform" value={cert.platform} onChange={(value) => onEntryChange("certifications", index, "platform", value)} />
            <TextInput label="Year" value={cert.year} onChange={(value) => onEntryChange("certifications", index, "year", value)} />
          </div>
        ))}
      </DynamicBuilderSection>

      {error && <div className="error-message">{error}</div>}

      <div className="form-actions">
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <Loader2 className="spin" size={18} /> : <Sparkles size={18} />}
          {loading ? "Generating..." : "Generate Resume"}
        </button>
        <button className="secondary-button" type="button" onClick={onReset}>
          <RefreshCcw size={18} />
          Reset Form
        </button>
      </div>
    </form>
  );
}

function BuilderSection({ title, children }) {
  return (
    <section className="builder-subsection">
      <h3>{title}</h3>
      <div className="builder-fields">{children}</div>
    </section>
  );
}

function DynamicBuilderSection({ title, addLabel, onAdd, children }) {
  return (
    <section className="builder-subsection">
      <div className="builder-subsection-header">
        <h3>{title}</h3>
        <button className="mini-button" type="button" onClick={onAdd}>
          <Plus size={16} />
          {addLabel}
        </button>
      </div>
      <div className="builder-fields">{children}</div>
    </section>
  );
}

function EntryHeader({ title, onRemove, removable }) {
  return (
    <div className="entry-header">
      <strong>{title}</strong>
      {removable && (
        <button className="icon-only-button" type="button" onClick={onRemove} aria-label={`Remove ${title}`}>
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder = "" }) {
  return (
    <label>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function ResumeBuilderPreview({ results, copied, onCopy, onDownload }) {
  if (!results) {
    return (
      <section className="results-empty resume-preview-empty">
        <div className="empty-icon">
          <FileText />
        </div>
        <h2>Resume preview will appear here</h2>
        <p>Generate a resume to copy, download, and review improvement tips.</p>
      </section>
    );
  }

  const sections = results.resumeSections;

  return (
    <section className="resume-preview-wrap">
      <div className="preview-actions">
        <button className="secondary-button" type="button" onClick={onCopy}>
          <Clipboard size={18} />
          {copied ? "Copied" : "Copy Resume Text"}
        </button>
        <button className="primary-button" type="button" onClick={onDownload}>
          <Download size={18} />
          Download as .txt
        </button>
      </div>

      <article className="resume-paper">
        <header className="resume-header">
          <h2>{sections.header.name}</h2>
          <p>{sections.header.contact}</p>
        </header>

        <ResumePreviewSection title="Professional Summary">
          <p>{sections.summary}</p>
        </ResumePreviewSection>

        <ResumePreviewSection title="Skills">
          <p><strong>Technical:</strong> {sections.skills.technical.join(", ") || "Add technical skills"}</p>
          <p><strong>Soft:</strong> {sections.skills.soft.join(", ") || "Add soft skills"}</p>
        </ResumePreviewSection>

        <ResumePreviewSection title="Education">
          <p>{[sections.education.degree, sections.education.college, sections.education.graduationYear, sections.education.cgpa].filter(Boolean).join(" | ") || "Add education details"}</p>
        </ResumePreviewSection>

        <ResumePreviewSection title="Projects">
          {sections.projects.length ? sections.projects.map((project, index) => (
            <div className="resume-item" key={`preview-project-${index}`}>
              <h4>{project.name || "Project"} {project.techStack ? `| ${project.techStack}` : ""}</h4>
              <p>{project.description || "Add project description"}</p>
              {project.link && <p>{project.link}</p>}
            </div>
          )) : <p>Add project details</p>}
        </ResumePreviewSection>

        <ResumePreviewSection title="Experience">
          {sections.experience.length ? sections.experience.map((item, index) => (
            <div className="resume-item" key={`preview-experience-${index}`}>
              <h4>{[item.role, item.company].filter(Boolean).join(" - ") || "Experience"} {item.duration ? `| ${item.duration}` : ""}</h4>
              <p>{item.responsibilities || "Add responsibilities"}</p>
            </div>
          )) : <p>Add internship or experience details</p>}
        </ResumePreviewSection>

        <ResumePreviewSection title="Certifications">
          {sections.certifications.length ? (
            <ul>
              {sections.certifications.map((cert, index) => (
                <li key={`preview-cert-${index}`}>{[cert.name, cert.platform, cert.year].filter(Boolean).join(" | ")}</li>
              ))}
            </ul>
          ) : <p>Add certifications</p>}
        </ResumePreviewSection>
      </article>

      <InfoCard icon={<Sparkles />} title="Improvement Tips" items={results.improvementTips} />
    </section>
  );
}

function ResumePreviewSection({ title, children }) {
  return (
    <section className="resume-preview-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function ResumeAnalysisResults({ results, copied, onCopySummary }) {
  if (!results) {
    return (
      <section className="results-empty resume-empty">
        <div className="empty-icon">
          <FileText />
        </div>
        <h2>Resume analysis will appear here</h2>
        <p>Upload a resume to review ATS readiness, missing sections, skill gaps, and a stronger summary.</p>
      </section>
    );
  }

  return (
    <section className="results-stack">
      <article className="result-card score-card">
        <div className="section-heading compact">
          <Gauge />
          <h2>Uploaded Resume Score</h2>
        </div>
        <div className="score-layout">
          <div className="score-ring" aria-label={`Uploaded resume score ${results.resumeScore} out of 100`}>
            <span>{results.resumeScore}</span>
            <small>/100</small>
          </div>
          <p className="score-note">Rule-based score from contact details, core sections, projects, education, and experience.</p>
        </div>
      </article>

      <InfoCard icon={<CheckCircle2 />} title="Strengths" items={results.strengths} tone="success" />
      <InfoCard icon={<RefreshCcw />} title="Weaknesses" items={results.weaknesses} tone="danger" />
      <InfoCard icon={<FileText />} title="Missing Sections" items={results.missingSections} />
      <InfoCard icon={<Sparkles />} title="Skill Suggestions" items={results.skillSuggestions} pill />
      <InfoCard icon={<Search />} title="Keyword Improvements" items={results.keywordSuggestions} />
      <InfoCard icon={<CheckCircle2 />} title="ATS Optimization Tips" items={results.atsTips} />

      <article className="result-card intro-card improved-summary-card">
        <div className="card-title-row">
          <div className="section-heading compact">
            <Sparkles />
            <h2>Improved Summary</h2>
          </div>
          <button className="icon-button" type="button" onClick={onCopySummary} aria-label="Copy improved summary">
            <Clipboard size={18} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p>{results.improvedSummary}</p>
      </article>
    </section>
  );
}

function Results({ results, copied, onCopyIntro }) {
  if (!results) {
    return (
      <section className="results-empty">
        <div className="empty-icon">
          <BriefcaseBusiness />
        </div>
        <h2>Your preparation report will appear here</h2>
        <p>Use this view to quickly review resume gaps, interview practice, and hiring opportunities.</p>
      </section>
    );
  }

  const scoreCues = Array.isArray(results.scoreCues) ? results.scoreCues : [];
  const interviewPrompts = Array.isArray(results.interviewPrompts) ? results.interviewPrompts : [];
  const companyLeads = Array.isArray(results.companyLeads) ? results.companyLeads : [];

  return (
    <section className="results-stack">
      <article className="result-card score-card">
        <div className="section-heading compact">
          <Gauge />
          <h2>Resume Score</h2>
        </div>
        <div className="score-layout">
          <div className="score-ring" aria-label={`Resume score ${results.resumeScore} out of 100`}>
            <span>{results.resumeScore}</span>
            <small>/100</small>
          </div>
          <div>
            <h3>Score Cues</h3>
            {scoreCues.length ? (
              <ul className="clean-list score-cues">
                {scoreCues.map((cue) => (
                  <li key={cue}>{cue}</li>
                ))}
              </ul>
            ) : (
              <p className="fallback-message">No score cues available yet</p>
            )}
          </div>
        </div>
      </article>

      <InfoCard icon={<FileText />} title="Resume Suggestions" items={results.suggestions} />
      <InfoCard icon={<CheckCircle2 />} title="Missing Skills" items={results.missingSkills} pill />
      <InfoCard
        icon={<MessageSquareText />}
        title="Interview Prompts"
        items={interviewPrompts}
        numbered
        fallback="No interview prompts available yet"
      />

      <article className="result-card intro-card">
        <div className="card-title-row">
          <div className="section-heading compact">
            <Sparkles />
            <h2>Self Introduction</h2>
          </div>
          <button className="icon-button" type="button" onClick={onCopyIntro} aria-label="Copy self introduction">
            <Clipboard size={18} />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p>{results.selfIntro}</p>
      </article>

      <article className="result-card companies-section">
        <div className="card-title-row">
          <div className="section-heading compact">
            <BriefcaseBusiness />
            <h2>Hiring Company Leads</h2>
          </div>
          <a
            className="primary-link"
            href={results.linkedinSearchUrl}
            target="_blank"
            rel="noreferrer"
          >
            Search this role on LinkedIn
            <ArrowUpRight size={17} />
          </a>
        </div>

        {companyLeads.length ? (
          <div className="company-grid">
            {companyLeads.map((company) => (
              <div className="company-card" key={`${company.companyName}-${company.roleTitle}`}>
                <div>
                  <h3>{company.companyName}</h3>
                  <p className="role-title">{company.roleTitle}</p>
                </div>
                <div className="company-meta">
                  <span>{company.location}</span>
                  <span>{company.jobType}</span>
                </div>
                <p>{company.reasonToApply}</p>
                <a className="company-link" href={company.linkedinUrl} target="_blank" rel="noreferrer">
                  Open LinkedIn
                  <ArrowUpRight size={16} />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="fallback-message">No company leads available yet</p>
        )}
      </article>
    </section>
  );
}

function InfoCard({ icon, title, items, pill = false, numbered = false, fallback = "No items available yet", tone = "" }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <article className={`result-card ${tone ? `tone-${tone}` : ""}`}>
      <div className="section-heading compact">
        {icon}
        <h2>{title}</h2>
      </div>
      {!safeItems.length ? (
        <p className="fallback-message">{fallback}</p>
      ) : pill ? (
        <div className="pill-list">
          {safeItems.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : (
        <ol className={numbered ? "numbered-list" : "clean-list"}>
          {safeItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
    </article>
  );
}

createRoot(document.getElementById("root")).render(<App />);
