/**
 * Idempotent ingestion pipeline: src/data/ → Gemini embeddings → Supabase.
 *
 * Failure-safe workflow (never touches production data on partial failure):
 *   1. Read + validate source data from src/data/
 *   2. Generate ALL embeddings via Gemini
 *   3. Validate ALL generated data
 *   4. Upsert to Supabase (portfolio_documents, projects)
 *   5. Verify the upsert succeeded
 *   6. Delete stale records (rows whose slug no longer exists in source data)
 *   7. Final verification
 *
 * Run with: npm run ingest
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

import resumeData from "../src/data/resume.json";
import { PROJECTS } from "../src/data/projects";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const EMBEDDING_DIMENSIONS = 768;

// ---------------------------------------------------------------------------
// 0. Environment
// ---------------------------------------------------------------------------

const EnvSchema = z.object({
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_EMBEDDING_MODEL: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = EnvSchema.parse(process.env);

const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// 1. Read + validate source data
// ---------------------------------------------------------------------------

const ResumeSchema = z.object({
  personal: z.object({
    name: z.string(),
    title: z.string(),
    location: z.string(),
    contact: z.object({ phone: z.string(), email: z.string() }),
    links: z.object({ linkedin: z.string(), github: z.string(), portfolio: z.string() }),
  }),
  summary: z.string().min(1),
  skills: z.record(z.string(), z.array(z.string())),
  experience: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      start: z.string(),
      end: z.string(),
      display_date: z.string(),
      highlights: z.array(z.string()),
    }),
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      url: z.string().optional(),
      subtitle: z.string().optional(),
      description: z.string(),
      technologies: z.array(z.string()),
      highlights: z.array(z.string()).optional(),
      metrics: z.record(z.string(), z.string()).optional(),
    }),
  ),
  education: z.array(
    z.object({
      credential: z.string(),
      institution: z.string(),
      start: z.string(),
      end: z.string(),
    }),
  ),
  certifications: z.array(
    z.object({
      name: z.string(),
      issuer: z.string(),
      url: z.string().optional(),
    }),
  ),
  leadership_and_extracurriculars: z.array(z.string()),
});

const ProjectsUiSchema = z.array(
  z.object({
    slug: z.string().min(1),
    title: z.string(),
    type: z.string(),
  }),
);

function validateSource() {
  const resume = ResumeSchema.parse(resumeData);
  const uiProjects = ProjectsUiSchema.parse(PROJECTS);

  if (resume.projects.length !== uiProjects.length) {
    throw new Error(
      `Source data mismatch: resume.json has ${resume.projects.length} projects but src/data/projects.ts produced ${uiProjects.length}. They must stay index-aligned.`,
    );
  }

  return { resume, uiProjects };
}

// ---------------------------------------------------------------------------
// Document/row builders
// ---------------------------------------------------------------------------

interface PendingDocument {
  slug: string;
  content: string;
  metadata: Record<string, unknown>;
}

interface PendingProject {
  slug: string;
  name: string;
  description: string;
  github_url: string | null;
  live_url: string | null;
  technologies: string[];
  category: string;
  highlights: string[] | null;
  embeddingText: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildDocuments(resume: z.infer<typeof ResumeSchema>, uiProjects: z.infer<typeof ProjectsUiSchema>): PendingDocument[] {
  const docs: PendingDocument[] = [];

  const { personal, summary } = resume;
  docs.push({
    slug: "about",
    content: `${personal.name} — ${personal.title}. Based in ${personal.location}. ${summary}`,
    metadata: { section: "about" },
  });

  const skillsText = Object.entries(resume.skills)
    .map(([category, items]) => `${category.replace(/_/g, " ")}: ${items.join(", ")}`)
    .join("\n");
  docs.push({
    slug: "skills",
    content: `Skills for ${personal.name}:\n${skillsText}`,
    metadata: { section: "skills" },
  });

  for (const exp of resume.experience) {
    docs.push({
      slug: `experience-${slugify(`${exp.company}-${exp.role}`)}`,
      content: `${exp.role} at ${exp.company} (${exp.display_date}). ${exp.highlights.join(" ")}`,
      metadata: { section: "experience", company: exp.company, role: exp.role },
    });
  }

  resume.projects.forEach((project, i) => {
    const uiSlug = uiProjects[i].slug;
    const metricsText = project.metrics
      ? ` Metrics: ${Object.entries(project.metrics)
          .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
          .join(", ")}.`
      : "";
    docs.push({
      slug: `project-${uiSlug}`,
      content: `${project.name}. ${project.description} ${(project.highlights ?? []).join(" ")} Technologies: ${project.technologies.join(", ")}.${metricsText}`,
      metadata: { section: "project", slug: uiSlug },
    });
  });

  const educationText = resume.education
    .map((e) => `${e.credential} — ${e.institution} (${e.start}–${e.end})`)
    .join("\n");
  docs.push({
    slug: "education",
    content: `Education for ${personal.name}:\n${educationText}`,
    metadata: { section: "education" },
  });

  const certificationsText = resume.certifications.map((c) => `${c.name} (${c.issuer})`).join("\n");
  docs.push({
    slug: "certifications",
    content: `Certifications for ${personal.name}:\n${certificationsText}`,
    metadata: { section: "certifications" },
  });

  docs.push({
    slug: "leadership",
    content: `Leadership and extracurriculars for ${personal.name}:\n${resume.leadership_and_extracurriculars.join("\n")}`,
    metadata: { section: "leadership" },
  });

  return docs;
}

function buildProjects(resume: z.infer<typeof ResumeSchema>, uiProjects: z.infer<typeof ProjectsUiSchema>): PendingProject[] {
  return resume.projects.map((project, i) => {
    const uiProject = uiProjects[i];
    return {
      slug: uiProject.slug,
      name: project.name,
      description: project.description,
      github_url: null,
      live_url: project.url ?? null,
      technologies: project.technologies,
      category: uiProject.type,
      highlights: project.highlights ?? null,
      embeddingText: `${project.name}. ${project.description} ${(project.highlights ?? []).join(" ")} Technologies: ${project.technologies.join(", ")}.`,
    };
  });
}

// ---------------------------------------------------------------------------
// 2. Generate embeddings
// ---------------------------------------------------------------------------

async function embedTexts(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  for (const text of texts) {
    const res = await ai.models.embedContent({
      model: env.GEMINI_EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });
    const values = res.embeddings?.[0]?.values;
    if (!values) {
      throw new Error(`Gemini returned no embedding for text: "${text.slice(0, 60)}..."`);
    }
    embeddings.push(values);
  }
  return embeddings;
}

// ---------------------------------------------------------------------------
// 3. Validate generated data
// ---------------------------------------------------------------------------

function validateEmbedding(slug: string, embedding: number[]) {
  if (embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Embedding for "${slug}" has ${embedding.length} dimensions, expected ${EMBEDDING_DIMENSIONS}.`);
  }
  if (embedding.some((v) => typeof v !== "number" || Number.isNaN(v))) {
    throw new Error(`Embedding for "${slug}" contains NaN or non-numeric values.`);
  }
}

// ---------------------------------------------------------------------------
// 4-7. Upsert, verify, delete stale, final verify
// ---------------------------------------------------------------------------

async function syncPortfolioDocuments(docs: PendingDocument[], embeddings: number[][]) {
  const rows = docs.map((doc, i) => ({
    slug: doc.slug,
    content: doc.content,
    metadata: doc.metadata,
    embedding: JSON.stringify(embeddings[i]),
  }));

  const { error: upsertError } = await supabase
    .from("portfolio_documents")
    .upsert(rows, { onConflict: "slug" });
  if (upsertError) throw new Error(`portfolio_documents upsert failed: ${upsertError.message}`);

  const { data: verifyRows, error: verifyError } = await supabase
    .from("portfolio_documents")
    .select("slug")
    .in(
      "slug",
      rows.map((r) => r.slug),
    );
  if (verifyError) throw new Error(`portfolio_documents verify failed: ${verifyError.message}`);
  if (verifyRows.length !== rows.length) {
    throw new Error(`portfolio_documents verify mismatch: expected ${rows.length} rows, found ${verifyRows.length}.`);
  }

  const currentSlugs = rows.map((r) => r.slug);
  const { data: allRows, error: listError } = await supabase.from("portfolio_documents").select("id, slug");
  if (listError) throw new Error(`portfolio_documents list failed: ${listError.message}`);

  const staleIds = (allRows ?? []).filter((r) => !currentSlugs.includes(r.slug)).map((r) => r.id);
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from("portfolio_documents").delete().in("id", staleIds);
    if (deleteError) throw new Error(`portfolio_documents stale delete failed: ${deleteError.message}`);
  }

  const { count, error: finalError } = await supabase
    .from("portfolio_documents")
    .select("id", { count: "exact", head: true });
  if (finalError) throw new Error(`portfolio_documents final verify failed: ${finalError.message}`);
  if (count !== rows.length) {
    throw new Error(`portfolio_documents final count mismatch: expected ${rows.length}, found ${count}.`);
  }

  return { upserted: rows.length, deleted: staleIds.length };
}

async function syncProjects(projects: PendingProject[], embeddings: number[][]) {
  const rows = projects.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    description: p.description,
    github_url: p.github_url,
    live_url: p.live_url,
    technologies: p.technologies,
    category: p.category,
    highlights: p.highlights,
    embedding: JSON.stringify(embeddings[i]),
  }));

  const { error: upsertError } = await supabase.from("projects").upsert(rows, { onConflict: "slug" });
  if (upsertError) throw new Error(`projects upsert failed: ${upsertError.message}`);

  const { data: verifyRows, error: verifyError } = await supabase
    .from("projects")
    .select("slug")
    .in(
      "slug",
      rows.map((r) => r.slug),
    );
  if (verifyError) throw new Error(`projects verify failed: ${verifyError.message}`);
  if (verifyRows.length !== rows.length) {
    throw new Error(`projects verify mismatch: expected ${rows.length} rows, found ${verifyRows.length}.`);
  }

  const currentSlugs = rows.map((r) => r.slug);
  const { data: allRows, error: listError } = await supabase.from("projects").select("id, slug");
  if (listError) throw new Error(`projects list failed: ${listError.message}`);

  const staleIds = (allRows ?? []).filter((r) => !currentSlugs.includes(r.slug)).map((r) => r.id);
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase.from("projects").delete().in("id", staleIds);
    if (deleteError) throw new Error(`projects stale delete failed: ${deleteError.message}`);
  }

  const { count, error: finalError } = await supabase.from("projects").select("id", { count: "exact", head: true });
  if (finalError) throw new Error(`projects final verify failed: ${finalError.message}`);
  if (count !== rows.length) {
    throw new Error(`projects final count mismatch: expected ${rows.length}, found ${count}.`);
  }

  return { upserted: rows.length, deleted: staleIds.length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("[ingest] 1/7 Reading + validating source data...");
  const { resume, uiProjects } = validateSource();
  const documents = buildDocuments(resume, uiProjects);
  const projects = buildProjects(resume, uiProjects);
  console.log(`[ingest]      ${documents.length} documents, ${projects.length} projects.`);

  console.log("[ingest] 2/7 Generating embeddings via Gemini...");
  const documentEmbeddings = await embedTexts(documents.map((d) => d.content));
  const projectEmbeddings = await embedTexts(projects.map((p) => p.embeddingText));

  console.log("[ingest] 3/7 Validating generated embeddings...");
  documents.forEach((d, i) => validateEmbedding(d.slug, documentEmbeddings[i]));
  projects.forEach((p, i) => validateEmbedding(p.slug, projectEmbeddings[i]));

  console.log("[ingest] 4-5/7 Upserting to Supabase + verifying...");
  const docResult = await syncPortfolioDocuments(documents, documentEmbeddings);
  const projResult = await syncProjects(projects, projectEmbeddings);

  console.log("[ingest] 6/7 Stale records removed:", {
    portfolio_documents: docResult.deleted,
    projects: projResult.deleted,
  });

  console.log("[ingest] 7/7 Final verification passed.");
  console.log("[ingest] Done:", {
    portfolio_documents: docResult.upserted,
    projects: projResult.upserted,
  });
}

main().catch((err) => {
  console.error("[ingest] FAILED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
