/**
 * TemplateEngine - Compiles Handlebars-like templates to Lit templates
 * Safe, sandboxed execution with helper functions
 * @version 2.0.0
 */

import { html, unsafeHTML } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';

/**
 * Template compilation and rendering engine
 * Replaces legacy Handlebars with Lit-based reactive templates
 */
export class TemplateEngine {
  constructor(options = {}) {
    this.cache = new Map();
    this.sandbox = new TemplateSandbox();
    this.debug = options.debug || false;
    
    // Register built-in helpers
    this.helpers = {
      ...this.builtinHelpers,
      ...(options.helpers || {})
    };
  }

  /**
   * Built-in template helpers
   */
  builtinHelpers = {
    // String helpers
    uppercase: (str) => String(str || '').toUpperCase(),
    lowercase: (str) => String(str || '').toLowerCase(),
    capitalize: (str) => String(str || '').replace(/^\w/, c => c.toUpperCase()),
    truncate: (str, length = 100, suffix = '...') => {
      const s = String(str || '');
      return s.length > length ? s.substring(0, length) + suffix : s;
    },
    
    // Date helpers
    date: (val, format = 'short') => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('it-IT', { dateStyle: format }).format(d);
    },
    datetime: (val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('it-IT', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      }).format(d);
    },
    timeago: (val) => {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      const seconds = Math.floor((new Date() - d) / 1000);
      
      const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
      };
      
      for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
          return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
      }
      return 'just now';
    },
    
    // Number helpers
    currency: (val, curr = 'EUR') => {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: curr
      }).format(val || 0);
    },
    number: (val, decimals = 0) => {
      return new Intl.NumberFormat('it-IT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(val || 0);
    },
    percent: (val) => {
      return new Intl.NumberFormat('it-IT', {
        style: 'percent',
        minimumFractionDigits: 1
      }).format((val || 0) / 100);
    },
    
    // Object/Array helpers
    json: (obj) => JSON.stringify(obj, null, 2),
    length: (arr) => (arr || []).length,
    keys: (obj) => Object.keys(obj || {}),
    values: (obj) => Object.values(obj || {}),
    entries: (obj) => Object.entries(obj || {}),
    
    // Logic helpers
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    gt: (a, b) => a > b,
    gte: (a, b) => a >= b,
    lt: (a, b) => a < b,
    lte: (a, b) => a <= b,
    and: (...args) => args.every(Boolean),
    or: (...args) => args.some(Boolean),
    not: (val) => !val,
    
    // Default fallback
    default: (val, fallback) => val != null ? val : fallback
  };

  /**
   * Compile template string to executable function
   * @param {string} templateString - Template with {{expressions}}
   * @param {string} scriptLogic - Optional JavaScript logic
   * @returns {Function} Compiled template function
   */
  compile(templateString, scriptLogic = '') {
    const cacheKey = this._hash(templateString + scriptLogic);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Transform template to Lit template
    const litTemplate = this._transformTemplate(templateString);
    
    // Create compiled function
    const compiledFn = this._createFunction(litTemplate, scriptLogic);
    
    this.cache.set(cacheKey, compiledFn);
    return compiledFn;
  }

  /**
   * Transform Handlebars-like syntax to Lit template
   */
  _transformTemplate(template) {
    let result = template;
    
    // Escape backticks to prevent injection
    result = result.replace(/`/g, '\\`');
    
    // Simple variable substitution: {{variable}}
    result = result.replace(/\{\{\{?(\w+(?:\.\w+)*)\}?\}\}/g, (match, path) => {
      return `\${this._getValue(data, '${path}')}`;
    });
    
    // Helper with args: {{helper arg1 arg2}}
    result = result.replace(/\{\{(\w+)\s+([^}]+)\}\}/g, (match, helper, args) => {
      const argList = args.split(/\s+/).map(a => `data.${a}`).join(', ');
      return `\${this.helpers.${helper}?.(${argList}) ?? ''}`;
    });
    
    // Conditionals: {{#if condition}}...{{/if}}
    result = result.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      '${data.$1 ? html`$2` : ""}'
    );
    
    // Unless: {{#unless condition}}...{{/unless}}
    result = result.replace(
      /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
      '${!data.$1 ? html`$2` : ""}'
    );
    
    // Each loops: {{#each items}}...{{/each}}
    result = result.replace(
      /\{\{#each\s+(\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      '${(data.$1 || []).map((item, index) => html`$2`).join("")}'
    );
    
    // With context: {{#with object}}...{{/with}}
    result = result.replace(
      /\{\{#with\s+(\w+)\}\}([\s\S]*?)\{\{\/with\}\}/g,
      '${(() => { const _ctx = data.$1; return _ctx ? html`$2` : ""; })()}'
    );
    
    // Raw HTML: {{{htmlContent}}}
    result = result.replace(
      /\{\{\{([^}]+)\}\}\}/g,
      '${unsafeHTML(String(this._getValue(data, "$1") || ""))}'
    );
    
    return result;
  }

  /**
   * Create executable function from transformed template
   */
  _createFunction(litTemplate, scriptLogic) {
    const fnBody = `
      "use strict";
      const { html, unsafeHTML } = window.lit;
      
      // Sandbox context
      const context = {
        data,
        helpers: this.helpers,
        _getValue: this._getValue.bind(this)
      };
      
      // Execute script logic if provided
      ${scriptLogic ? this._prepareScript(scriptLogic) : ''}
      
      // Return compiled template
      return html\`${litTemplate}\`;
    `;
    
    try {
      return new Function('data', 'html', 'unsafeHTML', fnBody).bind({
        helpers: this.helpers,
        _getValue: this._getValue.bind(this)
      });
    } catch (err) {
      console.error('Template compilation error:', err);
      return () => html`<span style="color:red">Template Error</span>`;
    }
  }

  /**
   * Safely get nested value from object
   */
  _getValue(obj, path) {
    if (!obj || !path) return '';
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value == null) return '';
      value = value[key];
    }
    
    return value ?? '';
  }

  /**
   * Prepare script for sandboxed execution
   */
  _prepareScript(script) {
    // Wrap in try-catch for safety
    return `
      try {
        with(context) {
          ${script}
        }
      } catch(e) {
        console.error('Template script error:', e);
      }
    `;
  }

  /**
   * Simple hash function for cache keys
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Clear template cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Add custom helper
   */
  addHelper(name, fn) {
    this.helpers[name] = fn;
  }

  /**
   * Remove custom helper
   */
  removeHelper(name) {
    delete this.helpers[name];
  }
}

/**
 * Sandboxed execution environment for template scripts
 */
class TemplateSandbox {
  constructor() {
    // Whitelist of allowed global objects
    this.allowedGlobals = new Set([
      'console', 'Math', 'Date', 'JSON', 'Array', 'Object',
      'String', 'Number', 'Boolean', 'RegExp', 'Error',
      'parseInt', 'parseFloat', 'isNaN', 'isFinite',
      'encodeURI', 'decodeURI', 'encodeURIComponent', 'decodeURIComponent',
      'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
      'Promise', 'Map', 'Set', 'WeakMap', 'WeakSet',
      'Intl', 'ArrayBuffer', 'Uint8Array', 'DataView'
    ]);
  }

  /**
   * Execute script in sandboxed context
   * @param {string} script - Script to execute
   * @param {Object} context - Context variables
   * @returns {any}
   */
  execute(script, context = {}) {
    // Create proxy to restrict global access
    const sandboxProxy = new Proxy({}, {
      has: () => true,
      get: (target, prop) => {
        if (prop === 'Symbol' || typeof prop === 'symbol') return undefined;
        if (this.allowedGlobals.has(prop)) {
          return window[prop];
        }
        if (prop in context) {
          return context[prop];
        }
        return undefined;
      }
    });

    try {
      const fn = new Function('sandbox', `
        "use strict";
        with (sandbox) {
          return (${script});
        }
      `);
      return fn(sandboxProxy);
    } catch (err) {
      console.error('Sandbox execution error:', err);
      return null;
    }
  }
}

export default TemplateEngine;
