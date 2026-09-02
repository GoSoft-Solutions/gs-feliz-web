/**
 * Thin client for the FELIZ API. All admin pages talk to the backend
 * through this module so the base URL and error handling live in one place.
 *
 * The base URL comes from NEXT_PUBLIC_API_URL (set in Vercel to the EB
 * environment URL). Falls back to localhost for local development.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const BASE = `${API_URL}/api/v1`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.message ?? JSON.stringify(body);
    } catch {
      detail = res.statusText;
    }
    throw new Error(`API ${res.status}: ${detail}`);
  }

  // Some endpoints (e.g. DELETE) may return an empty body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// ---- Types (mirror the API responses) ----
export interface Contact {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  sources?: ContactSource[];
}

export interface ContactSource {
  id: string;
  provider: string;
  source: string | null;
  campaignId: string | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  source: string | null;
  status: string;
  emailSubject: string | null;
  emailHtml: string | null;
  emailFromName: string | null;
  emailReplyTo: string | null;
  createdAt: string;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  contentType: string | null;
  fileName: string | null;
  sizeBytes: number | null;
  storageKey: string | null;
  downloadUrl: string | null;
  status: string;
  createdAt: string;
}

// ---- Contacts ----
export const contactsApi = {
  list: (search?: string) =>
    request<Paginated<Contact>>(
      `/contacts?pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ''}`,
    ),
};

// ---- Campaigns ----
export interface CampaignInput {
  name: string;
  slug?: string;
  source?: string;
  status?: string;
  emailSubject?: string;
  emailHtml?: string;
  emailFromName?: string;
  emailReplyTo?: string;
}

export const campaignsApi = {
  list: () => request<Campaign[]>('/campaigns'),
  create: (data: CampaignInput) =>
    request<Campaign>('/campaigns', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CampaignInput>) =>
    request<Campaign>(`/campaigns/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/campaigns/${id}`, { method: 'DELETE' }),
};

// ---- Content ----
export interface ContentInput {
  title: string;
  description?: string;
  category?: string;
  contentType?: string;
  fileName?: string;
  sizeBytes?: number;
  storageKey?: string;
  downloadUrl?: string;
  status?: string;
}

export const contentApi = {
  list: () => request<{ items: ContentItem[]; total: number }>('/content'),
  create: (data: ContentInput) =>
    request<ContentItem>('/content', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/content/${id}`, { method: 'DELETE' }),
  requestUpload: (fileName: string, contentType?: string) =>
    request<{ uploadUrl: string; storageKey: string }>('/content/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    }),
  downloadLink: (id: string) => request<{ url: string }>(`/content/${id}/download`),
};

/**
 * Uploads a file's bytes directly to S3 using a presigned PUT URL.
 * Kept separate from `request` because it targets S3, not our API, and
 * must not send the JSON Content-Type header.
 */
export async function uploadToS3(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
}
