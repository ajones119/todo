import { QueryClient } from '@tanstack/react-query'
import { createClient } from '@supabase/supabase-js'

// create a supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseKey);

// create a query client
export const queryClient = new QueryClient();

export const getImage = (filePath: string, param: string = "", bucket = "Campaign") => supabase.storage.from(bucket).getPublicUrl(filePath)?.data?.publicUrl + '?q=' + (param || 'q');

// Get API URL from environment variables
const getApiUrl = (): string => {
  const apiUrl =
    (import.meta.env.VITE_API_URL as string | undefined) ??
    (import.meta.env.API_URL as string | undefined);
  
  if (!apiUrl) {
    throw new Error('API URL is not configured (VITE_API_URL / API_URL)');
  }
  
  return apiUrl;
};

// Get client URL from environment variables
const getClientUrl = (): string => {
  return (import.meta.env.VITE_CLIENT_URL as string | undefined) || '';
};

// Get auth headers with session token
const getAuthHeaders = async (includeContentType: boolean = true): Promise<Record<string, string>> => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('No valid session/token found');
  }
  
  const clientUrl = getClientUrl();
  
  const headers: Record<string, string> = {
    Authorization: `Bearer ${session.access_token}`,
    'Accept': 'application/json',
    'Origin': clientUrl,
    'Access-Control-Allow-Origin': clientUrl,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Expose-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
  
  // Only include Content-Type if we have a body or explicitly requested
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  
  return headers;
};

// API request utility function
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiUrl = getApiUrl();
  
  // Determine if we should include Content-Type header
  // Only include it if there's a body
  const hasBody = options.body !== undefined && options.body !== null && options.body !== '';
  const includeContentType = hasBody;
  
  const headers = await getAuthHeaders(includeContentType);
  
  // Merge custom headers with auth headers (custom headers take precedence)
  const mergedHeaders: Record<string, string> = {
    ...headers,
    ...(options.headers as Record<string, string>),
  };
  
  // If there's no body, explicitly remove Content-Type even if it was in options.headers
  if (!hasBody && mergedHeaders['Content-Type']) {
    delete mergedHeaders['Content-Type'];
  }
  
  const res = await fetch(`${apiUrl}${endpoint}`, {
    ...options,
    headers: mergedHeaders,
  });
  
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const errorMessage = (body as { error?: string })?.error || `Server error: ${res.status}`;
    throw new Error(errorMessage);
  }
  
  // Handle empty responses
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T;
  }
  
  // Return empty object for non-JSON responses
  return {} as T;
}