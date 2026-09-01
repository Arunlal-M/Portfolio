/**
 * UI adapter for the Work component.
 * Reads from resume.json (the canonical source of truth) and maps
 * to the exact shape that Work.tsx expects.
 *
 * resume.json → projects.ts (adapter) → Work.tsx (UI)
 * resume.json → scripts/ingest.ts (AI)
 */
import resumeData from './resume.json';

export interface Project {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  type: string;
  desc: string;
  tech: string[];
  image: string;
  link: string;
}

/**
 * Mapping from resume.json project names to UI-specific fields.
 * This preserves the original UI presentation while keeping
 * resume.json as the single source of truth for content.
 */
const UI_METADATA: Record<string, Pick<Project, 'subtitle' | 'type' | 'image' | 'link'>> = {
  "ISRO-VSSC — Certification Operations Portal": {
    subtitle: "QA Workflow Engine",
    type: "Web Application",
    image: "/images/work/VSSC.webp",
    link: "https://vssc.globify.in/",
  },
  "Smana Al Raffa — Hotel Platform": {
    subtitle: "Booking Platform",
    type: "Full Stack",
    image: "/images/work/SMANA.webp",
    link: "https://smanahotels.com/",
  },
  "TRINS — Trivandrum International School Portal": {
    subtitle: "Web Application",
    type: "Frontend",
    image: "/images/work/TRINS.webp",
    link: "#",
  },
  "YouTube Video Translator — AI-Powered Streaming App": {
    subtitle: "AI-Powered App",
    type: "AI / ML",
    image: "/images/work/YT_TRANSALTOR.webp",
    link: "https://youtubetranslator.streamlit.app/",
  },
  "Cloud & DevOps Architecture": {
    subtitle: "Cloud Architecture",
    type: "DevOps",
    image: "/images/placeholder.webp",
    link: "#",
  },
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export const PROJECTS: Project[] = resumeData.projects.map((p, i) => {
  const meta = UI_METADATA[p.name] ?? {
    subtitle: "",
    type: "Project",
    image: "/images/placeholder.webp",
    link: p.url ?? "#",
  };

  return {
    id: i + 1,
    slug: slugify(p.name),
    title: p.name.split('—')[0].split('–')[0].trim(),
    subtitle: meta.subtitle,
    type: meta.type,
    desc: p.description,
    tech: p.technologies,
    image: meta.image,
    link: meta.link,
  };
});
