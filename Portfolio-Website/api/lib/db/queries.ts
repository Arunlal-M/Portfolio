/**
 * Data Access Object — the only place in the codebase allowed to talk to
 * Supabase directly. The AI layer (api/lib/ai/) must call these functions
 * instead of querying Supabase itself.
 */
import { supabase } from "./supabase.js";

export interface PortfolioDocument {
  id: number;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  github_url: string | null;
  live_url: string | null;
  technologies: string[] | null;
  category: string | null;
  highlights: string[] | null;
  similarity?: number;
}

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
  intent?: string;
  sentiment?: string;
  priority?: string;
  category?: string;
  ai_reply?: string;
}

export interface ContactMessage extends ContactMessageInput {
  id: number;
  created_at: string;
}

export interface VectorSearchOptions {
  matchThreshold?: number;
  matchCount?: number;
}

const DEFAULT_MATCH_THRESHOLD = 0.5;
const DEFAULT_MATCH_COUNT = 5;

/** Semantic search over the general knowledge base (about/skills/experience/education/...). */
export async function matchPortfolioDocuments(
  embedding: number[],
  filter: Record<string, unknown> = {},
  options: VectorSearchOptions = {},
): Promise<PortfolioDocument[]> {
  const { data, error } = await supabase.rpc("match_portfolio_documents", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: options.matchThreshold ?? DEFAULT_MATCH_THRESHOLD,
    match_count: options.matchCount ?? DEFAULT_MATCH_COUNT,
    filter,
  });

  if (error) throw new Error(`matchPortfolioDocuments failed: ${error.message}`);
  return (data ?? []) as PortfolioDocument[];
}

/**
 * Semantic search over projects, for the recommend-project feature.
 * Requires the `match_projects` SQL function — see supabase/sql/match_projects.sql.
 */
export async function matchProjects(embedding: number[], options: VectorSearchOptions = {}): Promise<Project[]> {
  const { data, error } = await supabase.rpc("match_projects", {
    query_embedding: JSON.stringify(embedding),
    match_threshold: options.matchThreshold ?? DEFAULT_MATCH_THRESHOLD,
    match_count: options.matchCount ?? DEFAULT_MATCH_COUNT,
  });

  if (error) throw new Error(`matchProjects failed: ${error.message}`);
  return (data ?? []) as Project[];
}

export async function listProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, description, github_url, live_url, technologies, category, highlights");

  if (error) throw new Error(`listProjects failed: ${error.message}`);
  return data ?? [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects")
    .select("id, slug, name, description, github_url, live_url, technologies, category, highlights")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`getProjectBySlug failed: ${error.message}`);
  return data;
}

export async function insertContactMessage(input: ContactMessageInput): Promise<ContactMessage> {
  const { data, error } = await supabase.from("contact_messages").insert(input).select().single();

  if (error) throw new Error(`insertContactMessage failed: ${error.message}`);
  return data;
}
