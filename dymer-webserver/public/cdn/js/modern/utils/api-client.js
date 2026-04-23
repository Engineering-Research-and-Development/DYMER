/**
 * ApiClient - HTTP client for DYMER API
 * @version 2.0.0
 */

export class ApiClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    // Default headers
    this.headers = {
      'Accept': 'application/json',
      ...options.headers
    };
  }

  /**
   * Get auth token from storage
   */
  getAuthToken() {
    return localStorage.getItem('DYMAT') || localStorage.getItem('DYM');
  }

  /**
   * Build request URL
   */
  buildUrl(endpoint) {
    if (endpoint.startsWith('http')) return endpoint;
    return `${this.baseUrl}${endpoint}`;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const token = this.getAuthToken();
    
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(options.body && !(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
        ...options.headers
      }
    };

    // Add timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    let lastError;
    
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new ApiError(response.status, response.statusText, await response.json().catch(() => null));
        }
        
        return await response.json();
      } catch (err) {
        lastError = err;
        
        // Don't retry on 4xx errors (client errors)
        if (err.status && err.status >= 400 && err.status < 500) {
          throw err;
        }
        
        // Wait before retry
        if (attempt < this.retries - 1) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP methods
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Custom API error class
 */
export class ApiError extends Error {
  constructor(status, statusText, data) {
    super(`${status}: ${statusText}`);
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.name = 'ApiError';
  }
}

// Singleton instance
let defaultClient = null;

export function getApiClient(options) {
  if (!defaultClient) {
    defaultClient = new ApiClient(options);
  }
  return defaultClient;
}

export default ApiClient;
