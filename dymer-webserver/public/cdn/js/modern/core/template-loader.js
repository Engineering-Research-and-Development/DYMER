/**
 * TemplateLoader - Fetches and caches templates from DYMER services
 * Handles versioning, caching, and dynamic loading
 * @version 2.0.0
 */

import { TemplateEngine } from './template-engine.js';

/**
 * Manages loading and caching of DYMER templates
 */
export class TemplateLoader {
  constructor(options = {}) {
    this.cache = new Map();
    this.loading = new Map();
    this.engine = new TemplateEngine({ debug: options.debug });
    
    this.config = {
      baseUrl: options.baseUrl || window.kmsconfig?.cdn?.replace('/public/cdn/', '') || '',
      templateEndpoint: options.templateEndpoint || '/api/templates/api/v1/template',
      cacheEnabled: options.cacheEnabled !== false,
      cacheDuration: options.cacheDuration || 5 * 60 * 1000, // 5 minutes
      ...options
    };
    
    if (this.config.debug) {
      console.log('[TemplateLoader] Initialized:', this.config);
    }
  }

  /**
   * Load template by ID
   * @param {string} templateId - Template identifier
   * @param {Object} options - Loading options
   * @returns {Promise<Object>} Parsed template data
   */
  async load(templateId, options = {}) {
    // Check memory cache first
    if (this.config.cacheEnabled && this.cache.has(templateId)) {
      const cached = this.cache.get(templateId);
      if (cached.expires > Date.now()) {
        if (this.config.debug) {
          console.log(`[TemplateLoader] Cache hit: ${templateId}`);
        }
        return cached.data;
      }
      // Expired
      this.cache.delete(templateId);
    }

    // Check if already loading
    if (this.loading.has(templateId)) {
      return this.loading.get(templateId);
    }

    // Start loading
    const loadPromise = this._fetchTemplate(templateId, options);
    this.loading.set(templateId, loadPromise);

    try {
      const template = await loadPromise;
      
      // Cache if enabled
      if (this.config.cacheEnabled) {
        this.cache.set(templateId, {
          data: template,
          expires: Date.now() + this.config.cacheDuration
        });
      }
      
      return template;
    } finally {
      this.loading.delete(templateId);
    }
  }

  /**
   * Fetch template from API
   */
  async _fetchTemplate(templateId, options) {
    const url = `${this.config.baseUrl}${this.config.templateEndpoint}`;
    
    // Build query for template
    const query = options.query || {
      query: { 
        "instance._index": templateId 
      }
    };

    const token = localStorage.getItem('DYMAT') || localStorage.getItem('DYM');
    
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...options
    };

    if (fetchOptions.method === 'POST' && query) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      fetchOptions.body = JSON.stringify(query);
    }

    if (this.config.debug) {
      console.log(`[TemplateLoader] Fetching: ${url}`, query);
    }

    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      throw new Error(`Failed to load template ${templateId}: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success || !result.data?.length) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Parse and process template
    return this._parseTemplate(result.data[0]);
  }

  /**
   * Parse raw template data into usable format
   */
  _parseTemplate(rawTemplate) {
    const template = {
      id: rawTemplate._id,
      title: rawTemplate.title,
      index: rawTemplate.instance?._index,
      metadata: rawTemplate.metadata || {},
      views: {},
      styles: {},
      scripts: {},
      files: rawTemplate.files || []
    };

    // Process files by type
    for (const file of rawTemplate.files || []) {
      const contentType = file.contentType || file.mimetype || '';
      
      switch (true) {
        case contentType.includes('html'):
          this._processViewFile(template, file);
          break;
        case contentType.includes('css'):
          this._processStyleFile(template, file);
          break;
        case contentType.includes('javascript'):
          this._processScriptFile(template, file);
          break;
      }
    }

    // Compile templates
    for (const [viewType, html] of Object.entries(template.views)) {
      const scriptLogic = template.scripts[viewType] || '';
      template.views[viewType] = this.engine.compile(html, scriptLogic);
    }

    if (this.config.debug) {
      console.log(`[TemplateLoader] Parsed template:`, template);
    }

    return template;
  }

  /**
   * Process HTML view file
   */
  _processViewFile(template, file) {
    const viewType = this._detectViewType(file.filename) || 'fullcontent';
    template.views[viewType] = file.data || '';
  }

  /**
   * Process CSS file
   */
  _processStyleFile(template, file) {
    const viewType = this._detectViewType(file.filename) || 'global';
    template.styles[viewType] = file.data || '';
  }

  /**
   * Process JavaScript file
   */
  _processScriptFile(template, file) {
    const viewType = this._detectViewType(file.filename) || 'global';
    template.scripts[viewType] = file.data || '';
  }

  /**
   * Detect view type from filename
   */
  _detectViewType(filename) {
    if (!filename) return 'fullcontent';
    
    const lower = filename.toLowerCase();
    if (lower.includes('teaserlist') || lower.includes('list')) return 'teaserlist';
    if (lower.includes('teaser') || lower.includes('card')) return 'teaser';
    if (lower.includes('map')) return 'teasermap';
    if (lower.includes('full') || lower.includes('detail')) return 'fullcontent';
    
    return 'fullcontent';
  }

  /**
   * Preload multiple templates
   * @param {string[]} templateIds - Array of template IDs
   * @returns {Promise<Object>} Map of loaded templates
   */
  async preload(templateIds) {
    const results = await Promise.allSettled(
      templateIds.map(id => this.load(id))
    );
    
    const templates = {};
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        templates[templateIds[index]] = result.value;
      } else {
        console.error(`Failed to load template ${templateIds[index]}:`, result.reason);
      }
    });
    
    return templates;
  }

  /**
   * Get cached template
   */
  getCached(templateId) {
    const cached = this.cache.get(templateId);
    return cached?.expires > Date.now() ? cached.data : null;
  }

  /**
   * Invalidate cache entry
   */
  invalidate(templateId) {
    this.cache.delete(templateId);
  }

  /**
   * Clear all cached templates
   */
  clearCache() {
    this.cache.clear();
    this.engine.clearCache();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cached: this.cache.size,
      loading: this.loading.size,
      entries: Array.from(this.cache.keys()).map(id => ({
        id,
        expires: new Date(this.cache.get(id).expires).toISOString()
      }))
    };
  }
}

/**
 * Singleton instance for global use
 */
let globalLoader = null;

export function getTemplateLoader(options) {
  if (!globalLoader) {
    globalLoader = new TemplateLoader(options);
  }
  return globalLoader;
}

export function setTemplateLoader(loader) {
  globalLoader = loader;
}

export default TemplateLoader;
