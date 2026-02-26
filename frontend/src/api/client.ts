import type {
    ChatRequest,
    ChatResponse,
    SearchRequest,
    SearchResponse,
    TextIngestRequest,
    WebIngestRequest,
    IngestResponse,
    HealthStatus,
} from '../types';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE_URL = (configuredApiUrl || '/api').replace(/\/$/, '');

class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

async function parseResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();

    if (!rawBody.trim()) {
        return null;
    }

    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(rawBody);
        } catch {
            throw new ApiError(
                response.status,
                'Server returned invalid JSON. Please verify backend deployment and API URL configuration.'
            );
        }
    }

    return rawBody;
}

async function handleResponse<T>(response: Response): Promise<T> {
    const parsedBody = await parseResponseBody(response);

    if (!response.ok) {
        const detail =
            typeof parsedBody === 'object' && parsedBody !== null && 'detail' in parsedBody
                ? String((parsedBody as { detail?: unknown }).detail)
                : typeof parsedBody === 'string' && parsedBody.trim()
                    ? parsedBody.slice(0, 300)
                    : `Request failed with status ${response.status}`;

        throw new ApiError(response.status, detail);
    }

    if (parsedBody === null) {
        return {} as T;
    }

    if (typeof parsedBody === 'string') {
        throw new ApiError(
            response.status,
            'Expected JSON response but received plain text/HTML. Check VITE_API_URL or backend routing.'
        );
    }

    return parsedBody as T;
}

// Health Endpoints
export async function getHealth(): Promise<HealthStatus> {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse<HealthStatus>(response);
}

// Chat Endpoints
export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return handleResponse<ChatResponse>(response);
}

export async function getConversation(conversationId: string): Promise<{
    conversation_id: string;
    messages: Array<{
        role: string;
        content: string;
        sources?: string[];
        timestamp: string;
    }>;
    created_at: string;
    updated_at: string;
}> {
    const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}`);
    return handleResponse(response);
}

export async function deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}

export async function clearConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/chat/conversation/${conversationId}/clear`, {
        method: 'POST',
    });
    return handleResponse(response);
}

// Search Endpoints
export async function search(request: SearchRequest): Promise<SearchResponse> {
    const response = await fetch(`${API_BASE_URL}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return handleResponse<SearchResponse>(response);
}

// Ingest Endpoints
export async function ingestDocument(
    file: File,
    metadata?: Record<string, unknown>
): Promise<IngestResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
    }

    const response = await fetch(`${API_BASE_URL}/ingest/document`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse<IngestResponse>(response);
}

export async function ingestText(request: TextIngestRequest): Promise<IngestResponse> {
    const response = await fetch(`${API_BASE_URL}/ingest/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return handleResponse<IngestResponse>(response);
}

export async function ingestWeb(request: WebIngestRequest): Promise<IngestResponse> {
    const response = await fetch(`${API_BASE_URL}/ingest/web`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    });
    return handleResponse<IngestResponse>(response);
}

export { ApiError };