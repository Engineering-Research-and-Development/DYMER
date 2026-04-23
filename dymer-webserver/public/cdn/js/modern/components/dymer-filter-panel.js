/**
 * DymerFilterPanel - Advanced filtering panel for entity searches
 * Supports multiple filter types, tags, and Elasticsearch query generation
 * @version 2.0.0
 * @element dymer-filter-panel
 */

import { DymerElement } from '../core/dymer-element.js';
import { html, css, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';

/**
 * @customElement
 * @attr {String} index - Entity type to filter
 * @attr {Boolean} expanded - Show filters expanded by default
 * @attr {String} layout - 'horizontal' | 'vertical' | 'collapsed'
 * @attr {Boolean} show-tags - Show active filters as tags
 */
export class DymerFilterPanel extends DymerElement {
  static properties = {
    index: { type: String },
    filters: { type: Array },
    activeFilters: { type: Object },
    filterSchema: { type: Object },
    expanded: { type: Boolean },
    layout: { type: String },
    showTags: { type: Boolean, attribute: 'show-tags' },
    searchText: { type: String },
    suggestions: { type: Array },
    showSuggestions: { type: Boolean },
    presetFilters: { type: Array }
  };

  static styles = css`
    :host {
      display: block;
      --filter-bg: #ffffff;
      --filter-border: #e5e7eb;
      --filter-primary: #3b82f6;
      --filter-radius: 8px;
      --filter-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .filter-container {
      background: var(--filter-bg);
      border: 1px solid var(--filter-border);
      border-radius: var(--filter-radius);
      box-shadow: var(--filter-shadow);
      overflow: hidden;
    }

    /* Header */
    .filter-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      background: #f9fafb;
      border-bottom: 1px solid var(--filter-border);
      cursor: pointer;
    }

    .filter-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #374151;
    }

    .filter-count {
      background: var(--filter-primary);
      color: white;
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      min-width: 20px;
      text-align: center;
    }

    .filter-toggle {
      background: none;
      border: none;
      font-size: 1.25rem;
      color: #6b7280;
      cursor: pointer;
      transition: transform 0.2s;
      padding: 0.25rem;
    }

    .filter-toggle.expanded {
      transform: rotate(180deg);
    }

    /* Search bar */
    .search-section {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--filter-border);
    }

    .search-wrapper {
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 2.5rem;
      border: 1px solid var(--filter-border);
      border-radius: var(--filter-radius);
      font-size: 0.95rem;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--filter-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: #9ca3af;
      pointer-events: none;
    }

    .search-clear {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 1rem;
      line-height: 1;
    }

    .search-clear:hover {
      color: #6b7280;
    }

    /* Suggestions dropdown */
    .suggestions {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.25rem;
      background: white;
      border: 1px solid var(--filter-border);
      border-radius: var(--filter-radius);
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 50;
    }

    .suggestion-item {
      padding: 0.625rem 1rem;
      cursor: pointer;
      transition: background 0.15s;
    }

    .suggestion-item:hover,
    .suggestion-item.highlighted {
      background: #eff6ff;
    }

    /* Filter body */
    .filter-body {
      padding: 1rem 1.25rem;
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .filter-body.expanded {
      max-height: 2000px;
    }

    /* Horizontal layout */
    :host([layout="horizontal"]) .filter-body {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      max-height: none;
    }

    :host([layout="horizontal"]) .filter-group {
      flex: 1;
      min-width: 200px;
      max-width: 300px;
    }

    /* Filter groups */
    .filter-group {
      margin-bottom: 1.25rem;
    }

    .filter-group:last-child {
      margin-bottom: 0;
    }

    .filter-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .filter-label-text {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .filter-reset {
      font-size: 0.75rem;
      color: var(--filter-primary);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
    }

    .filter-reset:hover {
      text-decoration: underline;
    }

    /* Input types */
    .filter-control {
      width: 100%;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--filter-border);
      border-radius: 6px;
      font-size: 0.875rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .filter-control:focus {
      outline: none;
      border-color: var(--filter-primary);
    }

    select.filter-control {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.25em;
      padding-right: 2.25rem;
    }

    /* Checkbox/Radio groups */
    .filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .filter-options::-webkit-scrollbar {
      width: 4px;
    }

    .filter-options::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0;
      cursor: pointer;
    }

    .filter-option:hover {
      color: var(--filter-primary);
    }

    .filter-option input {
      width: 1rem;
      height: 1rem;
      cursor: pointer;
    }

    .filter-option-label {
      flex: 1;
      font-size: 0.875rem;
    }

    .filter-option-count {
      font-size: 0.75rem;
      color: #9ca3af;
      background: #f3f4f6;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
    }

    /* Date range */
    .date-range {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .date-range input {
      flex: 1;
    }

    .date-range-separator {
      color: #9ca3af;
      font-size: 0.875rem;
    }

    /* Number range */
    .number-range {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .number-range input {
      flex: 1;
      min-width: 80px;
    }

    /* Tags section */
    .tags-section {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--filter-border);
      background: #f9fafb;
    }

    .tags-title {
      font-size: 0.75rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      font-size: 0.75rem;
      color: #1e40af;
    }

    .tag-remove {
      background: none;
      border: none;
      color: #3b82f6;
      cursor: pointer;
      padding: 0;
      font-size: 1rem;
      line-height: 1;
      display: flex;
      align-items: center;
    }

    .tag-remove:hover {
      color: #dc2626;
    }

    .clear-all {
      font-size: 0.75rem;
      color: #6b7280;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.375rem 0.75rem;
    }

    .clear-all:hover {
      color: #374151;
    }

    /* Preset filters */
    .preset-filters {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-top: 1px solid var(--filter-border);
      overflow-x: auto;
    }

    .preset-btn {
      white-space: nowrap;
      padding: 0.375rem 0.875rem;
      border: 1px solid var(--filter-border);
      background: white;
      border-radius: 9999px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .preset-btn:hover {
      border-color: var(--filter-primary);
      color: var(--filter-primary);
    }

    .preset-btn.active {
      background: var(--filter-primary);
      border-color: var(--filter-primary);
      color: white;
    }

    /* Footer actions */
    .filter-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--filter-border);
      background: #f9fafb;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--filter-primary);
      color: white;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: white;
      border: 1px solid var(--filter-border);
      color: #374151;
    }

    .btn-secondary:hover {
      background: #f3f4f6;
    }

    /* Empty state */
    .empty-filters {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
    }

    /* Loading skeleton */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
      height: 36px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  constructor() {
    super();
    this.filters = [];
    this.activeFilters = {};
    this.filterSchema = null;
    this.expanded = false;
    this.layout = 'vertical';
    this.showTags = true;
    this.searchText = '';
    this.suggestions = [];
    this.showSuggestions = false;
    this.presetFilters = [];
    this._suggestionTimeout = null;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.index) {
      this.loadFilterSchema();
    }
  }

  /**
   * Load filter schema from entity mapping
   */
  async loadFilterSchema() {
    try {
      // Get entity mapping to build filter fields
      const response = await this.callApi(`/api/v1/mapping/${this.index}`);
      const mapping = response.data?.[this.index]?.mappings || {};
      
      // Convert mapping to filter schema
      this.filterSchema = this.buildFilterSchema(mapping);
      
      // Load preset filters
      await this.loadPresets();
    } catch (err) {
      console.error('Failed to load filter schema:', err);
    }
  }

  /**
   * Build filter schema from ES mapping
   */
  buildFilterSchema(mapping) {
    const fields = [];
    
    const traverse = (props, prefix = '') => {
      for (const [key, value] of Object.entries(props)) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        
        if (value.properties) {
          traverse(value.properties, fullPath);
          continue;
        }

        const type = value.type;
        let filterType = 'text';
        
        switch (type) {
          case 'date':
            filterType = 'daterange';
            break;
          case 'integer':
          case 'long':
          case 'float':
          case 'double':
            filterType = 'numberrange';
            break;
          case 'boolean':
            filterType = 'boolean';
            break;
          case 'keyword':
            filterType = 'multiselect';
            break;
          default:
            filterType = 'text';
        }

        // Skip internal fields
        if (!key.startsWith('_')) {
          fields.push({
            key: fullPath,
            label: this.formatLabel(key),
            type: filterType,
            options: value.fields || []
          });
        }
      }
    };

    traverse(mapping);
    return fields;
  }

  /**
   * Load preset filters
   */
  async loadPresets() {
    try {
      const response = await this.callApi(
        `/api/dservice/api/v1/savedsearch?index=${this.index}`
      );
      this.presetFilters = response.data || [];
    } catch (err) {
      this.presetFilters = [];
    }
  }

  /**
   * Format field key as label
   */
  formatLabel(key) {
    return key
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Handle search input
   */
  _onSearchInput(e) {
    this.searchText = e.target.value;
    
    clearTimeout(this._suggestionTimeout);
    
    if (this.searchText.length < 2) {
      this.showSuggestions = false;
      return;
    }
    
    this._suggestionTimeout = setTimeout(() => {
      this.fetchSuggestions();
    }, 300);
  }

  /**
   * Fetch search suggestions
   */
  async fetchSuggestions() {
    try {
      const query = {
        query: {
          query_string: {
            query: `*${this.searchText}*`,
            default_operator: 'AND'
          }
        },
        size: 5,
        _source: ['title', '_id']
      };

      const response = await this.callApi('/api/v1/entity/_search', {
        method: 'POST',
        body: JSON.stringify(query)
      });

      this.suggestions = response.data || [];
      this.showSuggestions = this.suggestions.length > 0;
    } catch (err) {
      this.suggestions = [];
    }
  }

  /**
   * Apply search
   */
  _applySearch() {
    if (this.searchText) {
      this.activeFilters = {
        ...this.activeFilters,
        _search: {
          type: 'query_string',
          value: this.searchText
        }
      };
    } else {
      delete this.activeFilters._search;
    }
    
    this.showSuggestions = false;
    this.emitFilterChange();
  }

  /**
   * Handle filter change
   */
  _onFilterChange(key, value, type) {
    if (value === '' || value === null || value === undefined || 
        (Array.isArray(value) && value.length === 0)) {
      delete this.activeFilters[key];
    } else {
      this.activeFilters[key] = { type, value };
    }
    
    this.requestUpdate();
    this.emitFilterChange();
  }

  /**
   * Emit filter change event
   */
  emitFilterChange() {
    const query = this.buildQuery();
    
    this.emit('filter-change', {
      filters: this.activeFilters,
      query,
      filterCount: Object.keys(this.activeFilters).length
    });
  }

  /**
   * Build Elasticsearch query from filters
   */
  buildQuery() {
    const must = [];
    
    for (const [key, filter] of Object.entries(this.activeFilters)) {
      if (key === '_search') {
        must.push({
          query_string: {
            query: filter.value,
            default_operator: 'AND'
          }
        });
        continue;
      }

      switch (filter.type) {
        case 'term':
          must.push({ term: { [key]: filter.value } });
          break;
        case 'terms':
          must.push({ terms: { [key]: filter.value } });
          break;
        case 'range':
          must.push({ range: { [key]: filter.value } });
          break;
        case 'exists':
          must.push({ exists: { field: key } });
          break;
      }
    }

    return {
      bool: { must }
    };
  }

  /**
   * Clear all filters
   */
  clearAll() {
    this.activeFilters = {};
    this.searchText = '';
    this.requestUpdate();
    this.emitFilterChange();
  }

  /**
   * Clear single filter
   */
  clearFilter(key) {
    delete this.activeFilters[key];
    this.requestUpdate();
    this.emitFilterChange();
  }

  /**
   * Apply preset filter
   */
  applyPreset(preset) {
    this.activeFilters = preset.filters || {};
    this.requestUpdate();
    this.emitFilterChange();
  }

  /**
   * Render filter control based on type
   */
  renderFilterControl(filter) {
    const value = this.activeFilters[filter.key]?.value;
    
    switch (filter.type) {
      case 'text':
        return html`
          <input 
            type="text"
            class="filter-control"
            placeholder="Search ${filter.label.toLowerCase()}..."
            .value=${value || ''}
            @change=${e => this._onFilterChange(filter.key, e.target.value, 'term')}
          />
        `;

      case 'multiselect':
        return html`
          <div class="filter-options">
            ${filter.options?.map(opt => html`
              <label class="filter-option">
                <input 
                  type="checkbox"
                  .checked=${(value || []).includes(opt)}
                  @change=${e => {
                    const newValue = e.target.checked 
                      ? [...(value || []), opt]
                      : (value || []).filter(v => v !== opt);
                    this._onFilterChange(filter.key, newValue, 'terms');
                  }}
                />
                <span class="filter-option-label">${opt}</span>
              </label>
            `)}
          </div>
        `;

      case 'select':
        return html`
          <select 
            class="filter-control"
            @change=${e => this._onFilterChange(filter.key, e.target.value, 'term')}
          >
            <option value="">All ${filter.label}</option>
            ${filter.options?.map(opt => html`
              <option value="${opt}" ?selected=${value === opt}>${opt}</option>
            `)}
          </select>
        `;

      case 'daterange':
        const range = value || {};
        return html`
          <div class="date-range">
            <input 
              type="date"
              class="filter-control"
              .value=${range.gte || ''}
              @change=${e => {
                const newRange = { ...range, gte: e.target.value };
                this._onFilterChange(filter.key, newRange, 'range');
              }}
            />
            <span class="date-range-separator">to</span>
            <input 
              type="date"
              class="filter-control"
              .value=${range.lte || ''}
              @change=${e => {
                const newRange = { ...range, lte: e.target.value };
                this._onFilterChange(filter.key, newRange, 'range');
              }}
            />
          </div>
        `;

      case 'numberrange':
        const numRange = value || {};
        return html`
          <div class="number-range">
            <input 
              type="number"
              class="filter-control"
              placeholder="Min"
              .value=${numRange.gte || ''}
              @change=${e => {
                const newRange = { ...numRange, gte: parseFloat(e.target.value) };
                this._onFilterChange(filter.key, newRange, 'range');
              }}
            />
            <span class="date-range-separator">-</span>
            <input 
              type="number"
              class="filter-control"
              placeholder="Max"
              .value=${numRange.lte || ''}
              @change=${e => {
                const newRange = { ...numRange, lte: parseFloat(e.target.value) };
                this._onFilterChange(filter.key, newRange, 'range');
              }}
            />
          </div>
        `;

      case 'boolean':
        return html`
          <div class="filter-options">
            <label class="filter-option">
              <input 
                type="radio"
                name="${filter.key}"
                .checked=${value === true}
                @change=${() => this._onFilterChange(filter.key, true, 'term')}
              />
              <span class="filter-option-label">Yes</span>
            </label>
            <label class="filter-option">
              <input 
                type="radio"
                name="${filter.key}"
                .checked=${value === false}
                @change=${() => this._onFilterChange(filter.key, false, 'term')}
              />
              <span class="filter-option-label">No</span>
            </label>
            <label class="filter-option">
              <input 
                type="radio"
                name="${filter.key}"
                .checked=${value === undefined}
                @change=${() => this._onFilterChange(filter.key, undefined, 'term')}
              />
              <span class="filter-option-label">Any</span>
            </label>
          </div>
        `;

      default:
        return html`<input type="text" class="filter-control" disabled />`;
    }
  }

  /**
   * Render active filter tags
   */
  renderTags() {
    const entries = Object.entries(this.activeFilters);
    
    if (entries.length === 0) {
      return nothing;
    }

    return html`
      <div class="tags-section">
        <div class="tags-title">Active Filters (${entries.length})</div>
        <div class="tags-list">
          ${entries.map(([key, filter]) => {
            const label = this.filterSchema?.find(f => f.key === key)?.label || key;
            let valueText = '';
            
            if (typeof filter.value === 'string') {
              valueText = filter.value;
            } else if (Array.isArray(filter.value)) {
              valueText = filter.value.join(', ');
            } else if (typeof filter.value === 'object') {
              valueText = Object.entries(filter.value)
                .filter(([k, v]) => v)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' - ');
            }

            return html`
              <span class="filter-tag">
                <strong>${label}:</strong> ${valueText}
                <button class="tag-remove" @click=${() => this.clearFilter(key)}>×</button>
              </span>
            `;
          })}
          <button class="clear-all" @click=${this.clearAll}>Clear all</button>
        </div>
      </div>
    `;
  }

  render() {
    const activeCount = Object.keys(this.activeFilters).length;

    return html`
      <div class="filter-container">
        <!-- Header -->
        <div class="filter-header" @click=${() => this.expanded = !this.expanded}>
          <div class="filter-title">
            <span>🔍</span>
            <span>Filters</span>
            ${activeCount > 0 ? html`
              <span class="filter-count">${activeCount}</span>
            ` : nothing}
          </div>
          <button class="filter-toggle ${this.expanded ? 'expanded' : ''}">▼</button>
        </div>

        <!-- Search -->
        <div class="search-section">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text"
              class="search-input"
              placeholder="Search in all fields..."
              .value=${this.searchText}
              @input=${this._onSearchInput}
              @keydown=${e => e.key === 'Enter' && this._applySearch()}
            />
            ${this.searchText ? html`
              <button class="search-clear" @click=${() => { this.searchText = ''; this._applySearch(); }}>×</button>
            ` : nothing}
            
            ${this.showSuggestions ? html`
              <div class="suggestions">
                ${this.suggestions.map((item, i) => html`
                  <div 
                    class="suggestion-item"
                    @click=${() => {
                      this.searchText = item.title;
                      this._applySearch();
                    }}
                  >
                    ${item.title}
                  </div>
                `)}
              </div>
            ` : nothing}
          </div>
        </div>

        <!-- Filter Body -->
        <div class="filter-body ${this.expanded ? 'expanded' : ''}">
          ${this.filterSchema ? this.filterSchema.map(filter => html`
            <div class="filter-group">
              <div class="filter-label">
                <span class="filter-label-text">${filter.label}</span>
                ${this.activeFilters[filter.key] ? html`
                  <button class="filter-reset" @click=${() => this.clearFilter(filter.key)}>
                    Reset
                  </button>
                ` : nothing}
              </div>
              ${this.renderFilterControl(filter)}
            </div>
          `) : html`
            <div class="skeleton"></div>
            <div class="skeleton"></div>
            <div class="skeleton"></div>
          `}
        </div>

        <!-- Preset Filters -->
        ${this.presetFilters.length > 0 ? html`
          <div class="preset-filters">
            ${this.presetFilters.map(preset => html`
              <button 
                class="preset-btn ${this.activeFilters._preset === preset.id ? 'active' : ''}"
                @click=${() => this.applyPreset(preset)}
              >
                ${preset.name}
              </button>
            `)}
          </div>
        ` : nothing}

        <!-- Active Tags -->
        ${this.showTags ? this.renderTags() : nothing}

        <!-- Footer -->
        <div class="filter-footer">
          <button class="btn btn-secondary" @click=${this.clearAll}>
            Reset All
          </button>
          <button class="btn btn-primary" @click=${() => this.emit('apply-filters')}>
            Apply Filters
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('dymer-filter-panel', DymerFilterPanel);
export default DymerFilterPanel;
