/**
 * Thin client for the FELIZ API. All admin pages talk to the backend
 * through this module so the base URL and error handling live in one place.
 *
 * The base URL comes from NEXT_PUBLIC_API_URL (set in Vercel to the EB
 * environment URL). Falls back to localhost for local development.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
const BASE = `${API_URL}/api/v1`;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('feliz_token') : null;
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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

export interface ApiAdminUser { id: string; username: string; email: string; name: string; role: 'ADMIN' | 'EDITOR'; permissions: string[] }
export const authApi = {
  login: (identifier: string, password: string) => request<{ token: string; user: ApiAdminUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) }),
  users: () => request<ApiAdminUser[]>('/auth/users'),
  createUser: (data: { username: string; email: string; name: string; password: string; role: 'ADMIN' | 'EDITOR'; permissions: string[] }) => request<ApiAdminUser>('/auth/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: (id: string, data: { name?: string; password?: string; role?: 'ADMIN' | 'EDITOR'; permissions?: string[] }) => request<ApiAdminUser>(`/auth/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeUser: (id: string) => request<{ success: boolean }>(`/auth/users/${id}`, { method: 'DELETE' }),
  // Self-service: change MY OWN password (requires the current one) —
  // distinct from updateUser, which is an admin resetting someone else's.
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/auth/me/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
};

// ---- Types (mirror the API responses) ----
export interface Contact {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  status: string;
  /** Status computed from activity (same rule as Analíticas); `status` is the hand-edited one. */
  derivedStatus?: string;
  createdAt: string;
  sources?: ContactSource[];
}

export interface ContactSource {
  id: string;
  provider: string;
  source: string | null;
  campaignId: string | null;
  createdAt: string;
  campaign?: {
    id: string;
    name: string;
    slug: string;
    source: string | null;
  } | null;
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
export const CONTACTS_PAGE_SIZE = 50;

export const contactsApi = {
  // Server-side pagination, 50 per page. Always read the response's own
  // `.total` / `.totalPages` for counts — never `.items.length`, which is
  // only ever one page.
  list: (search?: string, page = 1, pageSize = CONTACTS_PAGE_SIZE, status?: string) =>
    request<Paginated<Contact>>(
      `/contacts?page=${page}&pageSize=${pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''}${status ? `&status=${status}` : ''}`,
    ),
  update: (id: string, data: Partial<Pick<Contact, 'email' | 'firstName' | 'lastName' | 'phone' | 'status'>>) =>
    request<Contact>(`/contacts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  remove: (id: string) => request<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),
  sendEmail: (id: string, data: { subject: string; html: string; fromName?: string }) =>
    request<{ success: boolean }>(`/contacts/${id}/email`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  sendBulkEmail: (data: { subject: string; html: string; audience: 'ALL' | 'LEAD' | 'NEWSLETTER'; campaignId?: string; fromName?: string }) =>
    request<{ success: boolean; matched: number; sent: number }>('/contacts/bulk-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
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
  description?: string | null;
  category?: string | null;
  contentType?: string;
  fileName?: string;
  sizeBytes?: number;
  storageKey?: string;
  downloadUrl?: string | null;
  status?: string;
}

export const contentApi = {
  list: () => request<{ items: ContentItem[]; total: number }>('/content'),
  create: (data: ContentInput) =>
    request<ContentItem>('/content', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<ContentInput>) =>
    request<ContentItem>(`/content/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: string) => request<void>(`/content/${id}`, { method: 'DELETE' }),
  requestUpload: (fileName: string, contentType?: string) =>
    request<{ uploadUrl: string; storageKey: string }>('/content/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, contentType }),
    }),
  downloadLink: (id: string) => request<{ url: string }>(`/content/${id}/download`),
  stableLink: (id: string) => `${API_URL}/api/v1/content/${id}/access`,
  // Opens the file in a new tab instead of downloading it — same object,
  // just a different Content-Disposition on the server's response.
  previewLink: (id: string) => `${API_URL}/api/v1/content/${id}/preview`,
};

// ---- Analytics ----
export interface AnalyticsOverview {
  totals: {
    contacts: number;
    newInWindow: number;
    newThisWeek: number;
    weekStart: string;
    activeMinCampaigns: number;
    campaigns: number;
    campaignsActive: number;
    emailsSent: number;
    unsubscribed: number;
    unsubscribeRate: number;
  };
  statusBreakdown: Array<{ status: string; count: number }>;
  sourceBreakdown: Array<{ source: string; count: number }>;
  growth: Array<{ date: string; count: number }>;
  campaignPerformance: Array<{ id: string; name: string; slug: string; createdAt: string; contacts: number; emailsSent: number }>;
  recentEvents: Array<{
    id: string;
    eventType: string;
    contactName: string;
    contactEmail: string | null;
    campaignName: string | null;
    source: string | null;
    createdAt: string;
  }>;
}

export const analyticsApi = {
  overview: (days = 30) => request<AnalyticsOverview>(`/analytics/overview?days=${days}`),
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

const STATUS_LABELS: Record<string, string> = {
  LEAD: 'Lead',
  ACTIVE: 'Activo',
  CUSTOMER: 'Cliente',
  INACTIVE: 'Inactivo',
};

/** Label for the status shown in tables: derived from activity when available. */
export function contactStatusLabel(c: { status: string; derivedStatus?: string }): string {
  const s = c.derivedStatus ?? c.status;
  return STATUS_LABELS[s] ?? s;
}
