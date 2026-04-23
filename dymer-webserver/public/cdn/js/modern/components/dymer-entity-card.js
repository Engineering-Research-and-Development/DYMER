/**
 * DymerEntityCard - Displays a single entity with dynamic template
 * Uses Lit for reactive rendering and Shadow DOM for isolation
 * @version 2.0.0
 * @element dymer-entity-card
 */

import { DymerElement } from '../core/dymer-element.js';
import { TemplateLoader, getTemplateLoader } from '../core/template-loader.js';
import { html, css, unsafeCSS, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';

/**
 * @customElement
 * @attr {String} entity-id - ID of the entity to display
 * @attr {String} template-id - Template to use for rendering
 * @attr {String} view-type - View type: 'fullcontent', 'teaser', 'teaserlist', 'teasermap'
 * @attr {Boolean} editable - Show edit/delete actions
 * @attr {Boolean} selectable - Enable click selection
 */
export class DymerEntityCard extends DymerElement {
  static properties = {
    entity: { type: Object },
    entityId: { type: String, attribute: 'entity-id' },
    templateId: { type: String, attribute: 'template-id' },
    viewType: { type: String, attribute: 'view-type' },
    editable: { type: Boolean },
    selectable: { type: Boolean },
    compact: { type: Boolean },
    selected: { type: Boolean, reflect: true }
  };

  static styles = css`
    :host {
      display: block;
      --card-bg: #ffffff;
      --card-radius: 8px;
      --card-shadow: 0 2px 8px rgba(0,0,0,0.1);
      --card-hover-shadow: 0 8px 24px rgba(0,0,0,0.15);
      --card-transition: transform 0.2s ease, box-shadow 0.2s ease;
      --card-padding: 1.5rem;
      --primary-color: #007bff;
      --secondary-color: #6c757d;
    }

    :host([selected]) .card {
      border: 2px solid var(--primary-color);
      box-shadow: 0 0 0 3px rgba(0,123,255,0.2);
    }

    .card {
      background: var(--card-bg);
      border-radius: var(--card-radius);
      box-shadow: var(--card-shadow);
      transition: var(--card-transition);
      overflow: hidden;
    }

    :host([selectable]) .card {
      cursor: pointer;
    }

    .card:hover {
      transform: translateY(-2px);
      box-shadow: var(--card-hover-shadow);
    }

    .card-header {
      padding: var(--card-padding);
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e9ecef;
    }

    .card-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #212529;
      line-height: 1.3;
    }

    .card-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
      font-size: 0.875rem;
      color: var(--secondary-color);
    }

    .card-body {
      padding: var(--card-padding);
    }

    .card-footer {
      padding: 1rem var(--card-padding);
      border-top: 1px solid #e9ecef;
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
      background: #f8f9fa;
    }

    /* Compact mode */
    :host([compact]) .card {
      padding: 1rem;
    }

    :host([compact]) .card-header {
      padding: 0 0 0.5rem 0;
    }

    :host([compact]) .card-body {
      padding: 0.5rem 0;
    }

    /* Status badges */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-published {
      background: #d4edda;
      color: #155724;
    }

    .status-draft {
      background: #fff3cd;
      color: #856404;
    }

    .status-unpublished {
      background: #f8d7da;
      color: #721c24;
    }

    /* Actions */
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .action-btn-primary {
      background: var(--primary-color);
      color: white;
    }

    .action-btn-primary:hover {
      background: #0056b3;
    }

    .action-btn-danger {
      background: #dc3545;
      color: white;
    }

    .action-btn-danger:hover {
      background: #c82333;
    }

    .action-btn-secondary {
      background: transparent;
      color: var(--secondary-color);
    }

    .action-btn-secondary:hover {
      background: #e9ecef;
    }

    /* Loading state */
    .skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 4px;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--secondary-color);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }
  `;

  constructor() {
    super();
    this.viewType = 'teaser';
    this.editable = false;
    this.selectable = false;
    this.compact = false;
    this.selected = false;
    this.templateCache = null;
    this._loader = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._loader = getTemplateLoader({ debug: this.debug });
    
    // If entityId provided but no entity, fetch it
    if (this.entityId && !this.entity) {
      this.fetchEntity();
    }
  }

  willUpdate(changedProperties) {
    // Load template when entity or templateId changes
    if (changedProperties.has('entity') || changedProperties.has('templateId')) {
      if (this.entity && this.templateId) {
        this.loadTemplate();
      }
    }
  }

  /**
   * Fetch entity data from API
   */
  async fetchEntity() {
    if (!this.entityId) return;
    
    try {
      const response = await this.callApi(`/api/v1/entity/${this.entityId}`);
      this.entity = response.data;
      this.emit('entity-loaded', { entity: this.entity });
    } catch (err) {
      this.error = `Failed to load entity: ${err.message}`;
    }
  }

  /**
   * Load and compile template
   */
  async loadTemplate() {
    if (!this.templateId) return;
    
    try {
      this.templateCache = await this._loader.load(this.templateId);
      this.emit('template-loaded', { template: this.templateCache });
    } catch (err) {
      console.warn('Failed to load template, using default:', err);
      this.templateCache = null;
    }
  }

  /**
   * Get permission info for current entity
   */
  getPermissions() {
    const user = this.getCurrentUser();
    if (!user || !this.entity) {
      return { view: true, edit: false, delete: false };
    }

    const isOwner = this.entity.properties?.owner?.uid === user.id;
    const isAdmin = this.isAdmin();
    
    // Check entity grants
    const grants = this.entity.properties?.grant || {};
    const canEdit = isAdmin || isOwner || 
      grants.update?.uid?.includes(user.id) ||
      grants.update?.gid?.includes(user.groupId);
    
    const canDelete = isAdmin || isOwner ||
      grants.delete?.uid?.includes(user.id) ||
      grants.delete?.gid?.includes(user.groupId);

    return { view: true, edit: canEdit, delete: canDelete, isOwner, isAdmin };
  }

  /**
   * Get status badge for entity
   */
  getStatusBadge() {
    const status = this.entity?.properties?.status;
    const labels = {
      '1': { text: 'Published', class: 'status-published' },
      '2': { text: 'Unpublished', class: 'status-unpublished' },
      '3': { text: 'Draft', class: 'status-draft' }
    };
    
    const config = labels[status] || { text: 'Unknown', class: '' };
    return html`<span class="status-badge ${config.class}">${config.text}</span>`;
  }

  /**
   * Render with dynamic template
   */
  renderWithTemplate() {
    const templateFn = this.templateCache?.views?.[this.viewType];
    
    if (templateFn) {
      try {
        // Get dynamic styles
        const dynamicStyles = this.templateCache.styles?.[this.viewType] || 
                            this.templateCache.styles?.global || '';
        
        return html`
          <style>${unsafeCSS(dynamicStyles)}</style>
          ${templateFn(this.entity)}
        `;
      } catch (err) {
        console.error('Template render error:', err);
      }
    }
    
    // Fallback to default template
    return this.renderDefault();
  }

  /**
   * Default template when no custom template available
   */
  renderDefault() {
    const perms = this.getPermissions();
    
    return html`
      <div class="card" @click=${this._onCardClick}>
        <div class="card-header">
          <h3 class="card-title">${this.entity?.title || 'Untitled'}</h3>
          <div class="card-meta">
            ${this.getStatusBadge()}
            <span>${this.formatDate(this.entity?._updatedAt || this.entity?._createdAt)}</span>
          </div>
        </div>
        
        <div class="card-body">
          <p>${this.entity?.description || 'No description'}</p>
        </div>
        
        ${this.editable && (perms.edit || perms.delete) ? html`
          <div class="card-footer">
            ${perms.edit ? html`
              <button class="action-btn action-btn-secondary" @click=${this._onEdit}>
                ✎ Edit
              </button>
            ` : nothing}
            ${perms.delete ? html`
              <button class="action-btn action-btn-danger" @click=${this._onDelete}>
                🗑 Delete
              </button>
            ` : nothing}
          </div>
        ` : nothing}
      </div>
    `;
  }

  /**
   * Render skeleton loading state
   */
  renderSkeleton() {
    return html`
      <div class="card">
        <div class="card-header">
          <div class="skeleton" style="height: 1.5rem; width: 60%;"></div>
          <div style="margin-top: 0.5rem;">
            <div class="skeleton" style="height: 0.875rem; width: 40%;"></div>
          </div>
        </div>
        <div class="card-body">
          <div class="skeleton" style="height: 1rem; width: 100%; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 1rem; width: 80%;"></div>
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return this.renderSkeleton();
    }

    if (this.error) {
      return html`
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">⚠</div>
            <p>${this.error}</p>
          </div>
        </div>
      `;
    }

    if (!this.entity) {
      return html`
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">📄</div>
            <p>No entity data</p>
          </div>
        </div>
      `;
    }

    return this.renderWithTemplate();
  }

  _onCardClick(e) {
    if (!this.selectable) return;
    
    // Don't select if clicking action buttons
    if (e.target.closest('.action-btn')) return;
    
    this.selected = !this.selected;
    this.emit('select', { 
      entity: this.entity, 
      selected: this.selected 
    });
  }

  _onEdit(e) {
    e.stopPropagation();
    this.emit('edit', { entity: this.entity });
  }

  _onDelete(e) {
    e.stopPropagation();
    if (confirm(`Delete "${this.entity.title || 'this entity'}"?`)) {
      this.emit('delete', { entityId: this.entity._id, entity: this.entity });
    }
  }
}

customElements.define('dymer-entity-card', DymerEntityCard);
export default DymerEntityCard;
