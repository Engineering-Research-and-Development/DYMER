/**
 * DymerElement - Base class for all DYMER Web Components
 * Built with Lit for reactive, efficient rendering
 * @version 2.0.0
 * @author DYMER Team
 */

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';

/**
 * Base class for all DYMER components
 * Provides authentication, theming, and API communication
 */
export class DymerElement extends LitElement {
  static properties = {
    loading: { type: Boolean, reflect: true },
    error: { type: String },
    config: { type: Object },
    debug: { type: Boolean, attribute: 'debug-mode' }
  };

  static styles = css`
    :host {
      display: block;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --dymer-primary: #007bff;
      --dymer-secondary: #6c757d;
      --dymer-success: #28a745;
      --dymer-danger: #dc3545;
      --dymer-warning: #ffc107;
      --dymer-info: #17a2b8;
      --dymer-light: #f8f9fa;
      --dymer-dark: #343a40;
    }
    
    .dymer-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 0.5rem;
    }
    
    .dymer-loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid var(--dymer-light);
      border-top-color: var(--dymer-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .dymer-error {
      color: var(--dymer-danger);
      padding: 1rem;
      border: 1px solid var(--dymer-danger);
      border-radius: 4px;
      background: #f8d7da;
      margin: 1rem 0;
    }
    
    .dymer-error-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
    }
    
    .dymer-empty {
      padding: 2rem;
      text-align: center;
      color: var(--dymer-secondary);
    }
  `;

  constructor() {
    super();
    this.loading = false;
    this.error = null;
    this.debug = false;
    this._abortController = null;
    
    // Initialize from global config if available
    this._initConfig();
  }

  /**
   * Initialize configuration from global kmsconfig
   */
  _initConfig() {
    const globalConfig = window.kmsconfig || {};
    const entityEndpoint = globalConfig.endpoints?.find(e => e.type === 'entity');
    
    this.config = {
      serverUrl: globalConfig.cdn?.replace('/public/cdn/', '') || '',
      apiBase: entityEndpoint?.endpoint || '',
      cdnUrl: globalConfig.cdn || '',
      ...globalConfig
    };
    
    if (this.debug) {
      console.log('[DymerElement] Config initialized:', this.config);
    }
  }

  /**
   * Get authentication token from storage
   * @returns {string|null} DYMAT or DYM token
   */
  getAuthToken() {
    return localStorage.getItem('DYMAT') || localStorage.getItem('DYM');
  }

  /**
   * Get extra token data
   * @returns {string|null}
   */
  getExtraToken() {
    return localStorage.getItem('DYM_EXTRA');
  }

  /**
   * Get current user info from localStorage
   * @returns {Object|null}
   */
  getCurrentUser() {
    const d_uid = localStorage.getItem('d_uid');
    const d_gid = localStorage.getItem('d_gid');
    const d_rl = localStorage.getItem('d_rl');
    
    if (!d_uid) return null;
    
    return {
      id: d_uid,
      groupId: d_gid,
      roles: d_rl ? JSON.parse(atob(d_rl)) : []
    };
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean}
   */
  hasRole(role) {
    const user = this.getCurrentUser();
    return user?.roles?.includes(role) || false;
  }

  /**
   * Check if user is admin
   * @returns {boolean}
   */
  isAdmin() {
    return this.hasRole('app-admin');
  }

  /**
   * Make authenticated API call
   * @param {string} endpoint - API endpoint (relative to apiBase)
   * @param {Object} options - Fetch options
   * @returns {Promise<any>}
   */
  async callApi(endpoint, options = {}) {
    // Cancel previous request if exists
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();

    const token = this.getAuthToken();
    const url = endpoint.startsWith('http') ? endpoint : `${this.config.apiBase}${endpoint}`;
    
    const headers = {
      'Accept': 'application/json',
      ...(options.body && !(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    if (this.debug) {
      console.log(`[DymerElement] API Call: ${options.method || 'GET'} ${url}`);
    }

    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: this._abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (this.debug) {
        console.log('[DymerElement] API Response:', data);
      }
      
      return data;
    } catch (err) {
      if (err.name === 'AbortError') {
        if (this.debug) console.log('[DymerElement] Request aborted');
        return null;
      }
      
      this.error = err.message;
      console.error('[DymerElement] API Error:', err);
      throw err;
    } finally {
      this.loading = false;
      this._abortController = null;
    }
  }

  /**
   * POST request helper
   */
  async post(endpoint, data, options = {}) {
    return this.callApi(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options
    });
  }

  /**
   * PUT request helper
   */
  async put(endpoint, data, options = {}) {
    return this.callApi(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options
    });
  }

  /**
   * PATCH request helper
   */
  async patch(endpoint, data, options = {}) {
    return this.callApi(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options
    });
  }

  /**
   * DELETE request helper
   */
  async delete(endpoint, options = {}) {
    return this.callApi(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Emit custom event
   * @param {string} eventName - Event name (without dymer- prefix)
   * @param {*} detail - Event detail
   * @param {Object} options - Event options
   */
  emit(eventName, detail, options = {}) {
    const event = new CustomEvent(`dymer-${eventName}`, {
      detail,
      bubbles: true,
      composed: true,
      ...options
    });
    
    this.dispatchEvent(event);
    
    if (this.debug) {
      console.log(`[DymerElement] Emitted: dymer-${eventName}`, detail);
    }
  }

  /**
   * Format date for display
   * @param {string|Date} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string}
   */
  formatDate(date, options = {}) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    return new Intl.DateTimeFormat('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(d);
  }

  /**
   * Format number as currency
   * @param {number} value
   * @param {string} currency
   * @returns {string}
   */
  formatCurrency(value, currency = 'EUR') {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency
    }).format(value);
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text
   * @returns {string}
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate unique ID
   * @param {string} prefix
   * @returns {string}
   */
  generateId(prefix = 'dymer') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up on disconnect
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    if (this._abortController) {
      this._abortController.abort();
    }
  }
}

export default DymerElement;
