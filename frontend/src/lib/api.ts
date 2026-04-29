export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export type SportType = "Olympic" | "Paralympic";

export interface SportSummary {
  slug: string;
  name: string;
  type: SportType;
  parity_pair: string | null;
}

export interface SportDetail extends SportSummary {
  title: string;
  sections: Record<string, string>;
  has_content: boolean;
}

export async function fetchSports(): Promise<SportSummary[]> {
  const response = await fetch(`${BACKEND_URL}/api/sports`, {
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sports: ${response.status}`);
  }
  return response.json();
}

export async function fetchSport(slug: string): Promise<SportDetail | null> {
  const response = await fetch(`${BACKEND_URL}/api/sports/${slug}`, {
    next: { revalidate: 60 },
  });
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch sport ${slug}: ${response.status}`);
  }
  return response.json();
}

export interface SavedMoment {
  moment_id: string;
  sport_slug: string | null;
  sport_name: string | null;
  moment_summary: string;
  explanation: string;
  follow_ups: Array<{ question: string; answer: string }>;
  frame_url: string | null;
  created_at: number;
}

export async function fetchMoment(id: string): Promise<SavedMoment | null> {
  const response = await fetch(`${BACKEND_URL}/api/moments/${id}`, {
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`Failed to fetch moment ${id}: ${response.status}`);
  }
  return response.json();
}

export interface SaveMomentInput {
  momentId: string;
  image: Blob;
  explanation: string;
  sportSlug?: string | null;
  sportName?: string | null;
  momentSummary?: string;
}

export async function saveMoment(
  input: SaveMomentInput,
): Promise<{ moment_id: string; frame_url: string; share_path: string }> {
  const form = new FormData();
  form.append("image", input.image, "frame.jpg");
  form.append("moment_id", input.momentId);
  form.append("explanation", input.explanation);
  if (input.sportSlug) form.append("sport_slug", input.sportSlug);
  if (input.sportName) form.append("sport_name", input.sportName);
  if (input.momentSummary) form.append("moment_summary", input.momentSummary);

  const response = await fetch(`${BACKEND_URL}/api/moments`, {
    method: "POST",
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Failed to save moment: ${response.status}`);
  }
  return response.json();
}

export function frameUrl(frame_url: string | null): string | null {
  if (!frame_url) return null;
  if (frame_url.startsWith("http")) return frame_url;
  return `${BACKEND_URL}${frame_url}`;
}
