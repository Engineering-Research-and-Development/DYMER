/**
 * TemplateCompiler - Simplified template compilation utility
 * @version 2.0.0
 */

export class TemplateCompiler {
  constructor() {
    this.cache = new Map();
    this.helpers = this._buildHelpers();
  }

  _buildHelpers() {
    return {
      uppercase: (str) => String(str || '').toUpperCase(),
      lowercase: (str) => String(str || '').toLowerCase(),
      capitalize: (str) => String(str || '').replace(/^\w/, c => c.toUpperCase()),
      truncate: (str, len = 100) => String(str || '').substring(0, len),
      date: (val) => new Date(val).toLocaleDateString('it-IT'),
      currency: (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0),
      json: (obj) => JSON.stringify(obj, null, 2)
    };
  }

  /**
   * Compile template string to function
   */
  compile(template) {
    const key = this._hash(template);
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Simple template substitution
    const compiled = (data = {}) => {
      return template.replace(/\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g, (match, path) => {
        const value = this._getValue(data, path);
        return value != null ? String(value) : '';
      });
    };

    this.cache.set(key, compiled);
    return compiled;
  }

  /**
   * Get nested value
   */
  _getValue(obj, path) {
    return path.split('.').reduce((o, key) => o?.[key], obj);
  }

  /**
   * Simple hash function
   */
  _hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = ((h << 5) - h) + str.charCodeAt(i);
      h = h & h;
    }
    return h;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }
}

export default TemplateCompiler;
