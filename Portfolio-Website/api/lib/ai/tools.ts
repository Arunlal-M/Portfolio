/**
 * Retrieval helpers used by the API routes. These are the only bridge
 * between the AI layer and the DAO — routes call these, not queries.ts
 * directly, and never construct Supabase calls themselves.
 */
import { embedText } from "./models";
import { matchPortfolioDocuments, matchProjects, type PortfolioDocument, type Project } from "../db/queries";

export async function retrievePortfolioContext(query: string, matchCount = 5): Promise<PortfolioDocument[]> {
  const embedding = await embedText(query);
  return matchPortfolioDocuments(embedding, {}, { matchCount });
}

export async function recommendProjects(query: string, matchCount = 3): Promise<Project[]> {
  const embedding = await embedText(query);
  return matchProjects(embedding, { matchCount });
}
