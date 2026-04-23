/**
 * DymerEntityList - Displays a list/grid of entities with virtual scrolling
 * Uses Lit for reactive rendering and Intersection Observer for performance
 * @version 2.0.0
 * @element dymer-entity-list
 */

import { DymerElement } from '../core/dymer-element.js';
import { TemplateLoader, getTemplateLoader } from '../core/template-loader.js';
import { html, css, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';

/**
 * @customElement
 * @attr {String} index - Entity type/index to query
 * @attr {String} view-type - 'teaserlist', 'teaser', 'datatable'
 * @attr {Number} page-size - Items per page (default: 20)
 * @attr {Boolean} infinite-scroll - Enable infinite scrolling
 * @attr {Boolean} paginated - Show pagination controls
 * @attr {String} query - JSON query filter
 */
export class DymerEntityList extends DymerElement {
  static properties = {
    index: { type: String },
    viewType: { type: String, attribute: 'view-type' },
    pageSize: { type: Number, attribute: 'page-size' },
    currentPage: { type: Number, attribute: 'current-page' },
    totalItems: { type: Number },
    items: { type: Array },
    infiniteScroll: { type: Boolean, attribute: 'infinite-scroll' },
    paginated: { type: Boolean },
    sortField: { type: String, attribute: 'sort-field' },
    sortDirection: { type: String, attribute: 'sort-direction' },
    filters: { type: Object },
    selectedIds: { type: Array },
    selectionMode: { type: String, attribute: 'selection-mode' } // 'none', 'single', 'multiple'
  };

  static styles = css`
    :host {
      display: block;
      --list-gap: 1rem;
      --list-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .list-container {
      display: grid;
      gap: var(--list-gap);
      grid-template-columns: var(--list-columns);
    }

    :host([view-type="teaser"]) .list-container {
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    }

    :host([view-type="teaserlist"]) .list-container {
      grid-template-columns: 1fr;
    }

    :host([view-type="datatable"]) .list-container {
      display: block;
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
      padding: 1.5rem;
      margin-top: 1rem;
    }

    .pagination button {
      padding: 0.5rem 1rem;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      min-width: 40px;
      transition: all 0.2s;
    }

    .pagination button:hover:not(:disabled) {
      background: #f8f9fa;
      border-color: #007bff;
    }

    .pagination button.active {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .pagination button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination-info {
      color: #6c757d;
      font-size: 0.875rem;
    }

    /* Loading indicator */
    .loading-sentinel {
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #6c757d;
    }

    .loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f0f0f0;
      border-top-color: #007bff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #6c757d;
      grid-column: 1 / -1;
    }

    .empty-state-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.3;
    }

    /* Toolbar */
    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sort-select {
      padding: 0.375rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      background: white;
    }

    .selection-info {
      font-size: 0.875rem;
      color: #495057;
    }

    /* Bulk actions */
    .bulk-actions {
      display: flex;
      gap: 0.5rem;
    }

    .bulk-actions button {
      padding: 0.375rem 0.75rem;
      border: 1px solid #ced4da;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .bulk-actions button:hover {
      background: #e9ecef;
    }
  `;

  constructor() {
    super();
    this.items = [];
    this.pageSize = 20;
    this.currentPage = 1;
    this.totalItems = 0;
    this.viewType = 'teaser';
    this.infiniteScroll = false;
    this.paginated = true;
    this.sortField = '_updatedAt';
    this.sortDirection = 'desc';
    this.filters = {};
    this.selectedIds = [];
    this.selectionMode = 'none';
    this._loader = null;
    this._observer = null;
    this._sentinel = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loader = getTemplateLoader({ debug: this.debug });
    
    if (this.index) {
      this.loadData();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._cleanupObserver();
  }

  _cleanupObserver() {
    if (this._observer && this._sentinel) {
      this._observer.unobserve(this._sentinel);
      this._observer = null;
      this._sentinel = null;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('index') && this.index) {
      this.currentPage = 1;
      this.items = [];
      this.loadData();
    }
    
    if (changedProperties.has('currentPage')) {
      if (!this.infiniteScroll) {
        this.loadData();
      }
    }
  }

  /**
   * Build search query
   */
  buildQuery() {
    const query = {
      query: {
        bool: {
          must: [
            { match: { "_index": this.index } }
          ]
        }
      },
      sort: [{ [this.sortField]: { order: this.sortDirection } }],
      from: (this.currentPage - 1) * this.pageSize,
      size: this.pageSize
    };

    // Add filters
    if (Object.keys(this.filters).length > 0) {
      Object.entries(this.filters).forEach(([field, value]) => {
        query.query.bool.must.push({ term: { [field]: value } });
      });
    }

    return query;
  }

  /**
   * Load data from API
   */
  async loadData(append = false) {
    if (!this.index) return;

    try {
      const query = this.buildQuery();
      
      const response = await this.callApi('/api/v1/entity/_search', {
        method: 'POST',
        body: JSON.stringify(query)
      });

      if (!response.data) {
        throw new Error('No data received');
      }

      // Process items (flatten _source)
      const newItems = response.data.map(item => ({
        ...item._source,
        _id: item._id,
        _index: item._index,
        _type: item._type
      }));

      if (append) {
        this.items = [...this.items, ...newItems];
      } else {
        this.items = newItems;
      }

      this.totalItems = response.total || response.data.length;
      
      this.emit('data-loaded', { 
        items: this.items, 
        total: this.totalItems 
      });

      // Setup infinite scroll if enabled
      if (this.infiniteScroll) {
        setTimeout(() => this.setupInfiniteScroll(), 100);
      }
    } catch (err) {
      this.error = err.message;
      this.emit('error', { error: err });
    }
  }

  /**
   * Setup Intersection Observer for infinite scroll
   */
  setupInfiniteScroll() {
    this._cleanupObserver();
    
    if (!this.infiniteScroll || this.items.length >= this.totalItems) return;

    this._sentinel = this.renderRoot?.querySelector('#scroll-sentinel');
    
    if (!this._sentinel) return;

    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loading) {
          this.loadMore();
        }
      });
    }, { rootMargin: '100px' });

    this._observer.observe(this._sentinel);
  }

  /**
   * Load more data for infinite scroll
   */
  async loadMore() {
    if (this.items.length >= this.totalItems) return;
    
    this.currentPage++;
    await this.loadData(true);
  }

  /**
   * Refresh data
   */
  async refresh() {
    this.currentPage = 1;
    await this.loadData();
  }

  /**
   * Handle entity selection
   */
  _onEntitySelect(e) {
    const { entity, selected } = e.detail;
    
    if (this.selectionMode === 'single') {
      this.selectedIds = selected ? [entity._id] : [];
    } else if (this.selectionMode === 'multiple') {
      if (selected) {
        this.selectedIds = [...this.selectedIds, entity._id];
      } else {
        this.selectedIds = this.selectedIds.filter(id => id !== entity._id);
      }
    }
    
    this.emit('selection-change', { 
      selectedIds: this.selectedIds,
      selectedEntities: this.items.filter(item => 
        this.selectedIds.includes(item._id)
      )
    });
  }

  /**
   * Handle sort change
   */
  _onSortChange(e) {
    const value = e.target.value;
    if (value.includes(':')) {
      const [field, dir] = value.split(':');
      this.sortField = field;
      this.sortDirection = dir;
    } else {
      this.sortField = value;
    }
    this.currentPage = 1;
    this.loadData();
  }

  /**
   * Change page
   */
  goToPage(page) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  get totalPages() {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  /**
   * Render toolbar with sorting and bulk actions
   */
  renderToolbar() {
    const hasSelection = this.selectedIds.length > 0;
    
    return html`
      <div class="toolbar">
        <div class="toolbar-left">
          <select class="sort-select" @change=${this._onSortChange}>
            <option value="_updatedAt:desc" ?selected=${this.sortField === '_updatedAt'}>
              Latest Updated
            </option>
            <option value="_createdAt:desc" ?selected=${this.sortField === '_createdAt'}>
              Latest Created
            </option>
            <option value="title:asc" ?selected=${this.sortField === 'title'}>
              Title A-Z
            </option>
            <option value="title:desc" ?selected=${this.sortField === 'title' && this.sortDirection === 'desc'}>
              Title Z-A
            </option>
          </select>
          
          ${hasSelection ? html`
            <span class="selection-info">
              ${this.selectedIds.length} selected
            </span>
          ` : nothing}
        </div>
        
        <div class="toolbar-right">
          ${hasSelection ? html`
            <div class="bulk-actions">
              <button @click=${() => this.emit('bulk-delete', { ids: this.selectedIds })}>
                Delete Selected
              </button>
              <button @click=${() => this.selectedIds = []}>
                Clear Selection
              </button>
            </div>
          ` : nothing}
          
          <span class="pagination-info">
            ${this.items.length} of ${this.totalItems} items
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Render pagination controls
   */
  renderPagination() {
    if (!this.paginated || this.infiniteScroll) return nothing;
    
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - 2);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    // First page
    if (start > 1) {
      pages.push(html`
        <button @click=${() => this.goToPage(1)}>1</button>
        ${start > 2 ? html`<span>...</span>` : nothing}
      `);
    }

    // Page numbers
    for (let i = start; i <= end; i++) {
      pages.push(html`
        <button 
          class=${i === this.currentPage ? 'active' : ''}
          @click=${() => this.goToPage(i)}
        >
          ${i}
        </button>
      `);
    }

    // Last page
    if (end < this.totalPages) {
      pages.push(html`
        ${end < this.totalPages - 1 ? html`<span>...</span>` : nothing}
        <button @click=${() => this.goToPage(this.totalPages)}>${this.totalPages}</button>
      `);
    }

    return html`
      <div class="pagination">
        <button 
          ?disabled=${this.currentPage === 1}
          @click=${() => this.goToPage(this.currentPage - 1)}
        >
          ← Previous
        </button>
        ${pages}
        <button 
          ?disabled=${this.currentPage >= this.totalPages}
          @click=${() => this.goToPage(this.currentPage + 1)}
        >
          Next →
        </button>
      </div>
    `;
  }

  /**
   * Render entity cards
   */
  renderItems() {
    if (this.items.length === 0) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>No items found</p>
        </div>
      `;
    }

    return html`
      ${this.items.map(item => html`
        <dymer-entity-card
          .entity=${item}
          template-id=${item._index}
          view-type=${this.viewType}
          ?editable=${this.selectionMode !== 'none'}
          ?selectable=${this.selectionMode !== 'none'}
          ?selected=${this.selectedIds.includes(item._id)}
          ?compact=${this.viewType === 'teaserlist'}
          @dymer-select=${this._onEntitySelect}
          @dymer-edit=${(e) => this.emit('edit', e.detail)}
          @dymer-delete=${(e) => this.emit('delete', e.detail)}
        ></dymer-entity-card>
      `)}
      
      ${this.infiniteScroll ? html`
        <div id="scroll-sentinel" class="loading-sentinel">
          ${this.loading && this.items.length < this.totalItems ? html`
            <div class="loading-spinner"></div>
          ` : nothing}
        </div>
      ` : nothing}
    `;
  }

  render() {
    if (this.error) {
      return html`
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <p>${this.error}</p>
          <button @click=${this.refresh}>Retry</button>
        </div>
      `;
    }

    return html`
      ${this.renderToolbar()}
      
      <div class="list-container">
        ${this.renderItems()}
      </div>
      
      ${this.renderPagination()}
    `;
  }
}

customElements.define('dymer-entity-list', DymerEntityList);
export default DymerEntityList;
