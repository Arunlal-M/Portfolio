/**
 * UI adapter for the Career component.
 * Reads from resume.json (the canonical source of truth) and maps
 * to the exact shape that Career.tsx expects.
 *
 * resume.json → experience.ts (adapter) → Career.tsx (UI)
 * resume.json → scripts/ingest.ts (AI)
 */
import resumeData from './resume.json';

export interface Experience {
  id: number;
  slug: string;
  period: string;
  periodEnd: string;
  type: string;
  location: string;
  company: string;
  role: string;
  bullets: string[];
  tech: string[];
}

/**
 * UI-specific metadata that resume.json doesn't carry
 * (display type, location label, and condensed tech tags for the UI).
 */
interface UIMeta {
  type: string;
  location: string;
  tech: string[];
}

const UI_METADATA: Record<string, UIMeta> = {
  "Globify Software Solutions": {
    type: "Full-Time",
    location: "Globify",
    tech: ["Node.js", "Express", "Django", "Docker", "AWS", "Terraform"],
  },
  "MashupStack": {
    type: "Internship",
    location: "MashupStack",
    tech: ["React", "Django REST", "PostgreSQL", "MySQL"],
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractYear(dateStr: string): string {
  return dateStr.split('-')[0];
}

// Map experience entries from resume.json
const experienceFromResume: Experience[] = resumeData.experience.map((exp, i) => {
  const meta = UI_METADATA[exp.company] ?? {
    type: "Work",
    location: exp.company,
    tech: [],
  };

  return {
    id: i + 1,
    slug: slugify(`${exp.company}-${exp.role}`),
    period: extractYear(exp.start),
    periodEnd: extractYear(exp.end),
    type: meta.type,
    location: meta.location,
    company: exp.company,
    role: exp.role,
    bullets: exp.highlights,
    tech: meta.tech,
  };
});

// Education entry from resume.json (the original Career.tsx included this)
const educationEntry: Experience = {
  id: experienceFromResume.length + 1,
  slug: slugify(`${resumeData.education[0].institution}-${resumeData.education[0].credential}`),
  period: resumeData.education[0].start,
  periodEnd: resumeData.education[0].end,
  type: "Education",
  location: "Kariavattom",
  company: resumeData.education[0].institution,
  role: resumeData.education[0].credential,
  bullets: [
    "Completed Bachelor of Technology in Computer Science and Engineering.",
    "Laid a strong foundation in software development, data structures, algorithms, and system design.",
  ],
  tech: ["Data Structures", "Algorithms", "System Design"],
};

export const EXPS: Experience[] = [...experienceFromResume, educationEntry];
