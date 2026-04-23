/**
 * DymerFormModal - Dynamic form modal for entity creation/editing
 * Replaces legacy loadModelListToModal functionality
 * @version 2.0.0
 * @element dymer-form-modal
 */

import { DymerElement } from '../core/dymer-element.js';
import { html, css, nothing } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/all/lit-all.min.js';

/**
 * @customElement
 * @attr {String} entity-id - ID of entity to edit (null for create)
 * @attr {String} form-index - Entity type/index
 * @attr {String} mode - 'create' or 'edit'
 * @attr {Boolean} open - Modal visibility
 */
export class DymerFormModal extends DymerElement {
  static properties = {
    entityId: { type: String, attribute: 'entity-id' },
    formIndex: { type: String, attribute: 'form-index' },
    mode: { type: String },
    open: { type: Boolean, reflect: true },
    formStructure: { type: Object },
    formData: { type: Object },
    files: { type: Object },
    saving: { type: Boolean },
    validating: { type: Boolean }
  };

  static styles = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 10000;
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }

    :host([open]) {
      display: flex;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      animation: modalIn 0.3s ease;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f9fafb;
    }

    .modal-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .modal-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .modal-body {
      padding: 1.5rem;
      overflow-y: auto;
      flex: 1;
      max-height: calc(90vh - 140px);
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .form-label.required::after {
      content: ' *';
      color: #ef4444;
    }

    .form-control {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .form-control:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-control.error {
      border-color: #ef4444;
      background: #fef2f2;
    }

    .form-control:disabled {
      background: #f3f4f6;
      cursor: not-allowed;
    }

    textarea.form-control {
      min-height: 120px;
      resize: vertical;
    }

    select.form-control {
      appearance: none;
      background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    .form-help {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.375rem;
    }

    .form-error {
      font-size: 0.75rem;
      color: #ef4444;
      margin-top: 0.375rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* Checkbox / Radio */
    .form-check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .form-check-input {
      width: 1.125rem;
      height: 1.125rem;
      cursor: pointer;
    }

    .form-check-label {
      cursor: pointer;
      user-select: none;
    }

    /* File upload */
    .file-upload {
      border: 2px dashed #d1d5db;
      border-radius: 8px;
      padding: 2rem;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
      cursor: pointer;
    }

    .file-upload:hover {
      border-color: #3b82f6;
      background: #eff6ff;
    }

    .file-upload.dragover {
      border-color: #3b82f6;
      background: #dbeafe;
    }

    .file-upload-input {
      display: none;
    }

    .file-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 6px;
      margin-top: 0.75rem;
    }

    .file-preview img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
    }

    .file-info {
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: #374151;
    }

    .file-size {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .file-remove {
      color: #ef4444;
      cursor: pointer;
      background: none;
      border: none;
      font-size: 1.25rem;
    }

    /* Repeatable fields */
    .repeatable-group {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .repeatable-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .repeatable-title {
      font-weight: 500;
      color: #374151;
    }

    .repeatable-actions {
      display: flex;
      gap: 0.5rem;
    }

    .repeatable-btn {
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: background 0.2s;
    }

    .repeatable-btn-add {
      background: #3b82f6;
      color: white;
    }

    .repeatable-btn-add:hover {
      background: #2563eb;
    }

    .repeatable-btn-remove {
      background: #ef4444;
      color: white;
    }

    .repeatable-btn-remove:hover {
      background: #dc2626;
    }

    /* Relation picker */
    .relation-picker {
      position: relative;
    }

    .relation-search {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.95rem;
    }

    .relation-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      max-height: 250px;
      overflow-y: auto;
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 0 0 6px 6px;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      z-index: 10;
    }

    .relation-item {
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .relation-item:hover {
      background: #f3f4f6;
    }

    .relation-item.selected {
      background: #eff6ff;
      color: #2563eb;
    }

    /* Modal footer */
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      background: #f9fafb;
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border: none;
      border-radius: 6px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }

    .btn-primary {
      background: #3b82f6;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #2563eb;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    /* Loading state */
    .form-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #6b7280;
    }

    .form-loading-spinner {
      width: 24px;
      height: 24px;
      border: 3px solid #f3f4f6;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 0.75rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Grid layout for fields */
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }
  `;

  constructor() {
    super();
    this.mode = 'create';
    this.open = false;
    this.formStructure = null;
    this.formData = {};
    this.files = {};
    this.saving = false;
    this.validating = false;
    this._validationErrors = new Map();
  }

  /**
   * Open modal with configuration
   * @param {Object} config - Modal configuration
   */
  async openModal(config = {}) {
    this.mode = config.mode || 'create';
    this.formIndex = config.formIndex || this.formIndex;
    this.entityId = config.entityId || null;
    
    this.open = true;
    this.formData = {};
    this.files = {};
    this._validationErrors.clear();
    
    // Load form structure
    await this.loadFormStructure();
    
    // If editing, load entity data
    if (this.mode === 'edit' && this.entityId) {
      await this.loadEntityData();
    }
    
    // Emit opened event
    this.emit('opened', { mode: this.mode, formIndex: this.formIndex });
  }

  /**
   * Close modal
   */
  close() {
    this.open = false;
    this.formStructure = null;
    this.formData = {};
    this.emit('closed');
  }

  /**
   * Load form structure from API
   */
  async loadFormStructure() {
    if (!this.formIndex) return;

    try {
      const response = await this.callApi(
        `/api/forms/api/v1/form?index=${this.formIndex}`
      );
      
      if (response.data?.length > 0) {
        this.formStructure = this.parseFormStructure(response.data[0]);
      }
    } catch (err) {
      this.error = 'Failed to load form';
      console.error(err);
    }
  }

  /**
   * Parse form structure from API response
   */
  parseFormStructure(raw) {
    // Extract form fields from HTML
    const htmlContent = raw.files?.find(f => 
      f.contentType?.includes('html')
    )?.data || '';

    // Parse fields from HTML
    const fields = this.extractFieldsFromHtml(htmlContent);

    return {
      id: raw._id,
      title: raw.title,
      fields,
      html: htmlContent,
      metadata: raw.metadata || {}
    };
  }

  /**
   * Extract field definitions from HTML
   */
  extractFieldsFromHtml(html) {
    const fields = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Find all form inputs
    const inputs = doc.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      const name = input.getAttribute('name');
      if (!name) return;
      
      // Parse field name (data[field] or data[field][nested])
      const match = name.match(/data\[(\w+)\](?:\[(\w+)\])?/);
      if (!match) return;
      
      const field = {
        name: match[1],
        subName: match[2],
        type: input.type || input.tagName.toLowerCase(),
        required: input.hasAttribute('required'),
        label: input.getAttribute('placeholder') || 
               input.getAttribute('data-label') ||
               match[1],
        validation: input.getAttribute('data-validation'),
        options: []
      };
      
      // Extract options for select
      if (input.tagName === 'SELECT') {
        field.options = Array.from(input.options).map(opt => ({
          value: opt.value,
          label: opt.text
        }));
      }
      
      fields.push(field);
    });
    
    return fields;
  }

  /**
   * Load entity data for editing
   */
  async loadEntityData() {
    try {
      const response = await this.callApi(`/api/v1/entity/${this.entityId}`);
      const entity = response.data;
      
      // Flatten entity data for form
      this.formData = {
        ...entity,
        ...entity._source,
        ...entity.properties
      };
      
      this.emit('entity-loaded', { entity });
    } catch (err) {
      this.error = 'Failed to load entity';
    }
  }

  /**
   * Handle field change
   */
  _onFieldChange(fieldName, value) {
    this.formData = {
      ...this.formData,
      [fieldName]: value
    };
    
    // Clear validation error for this field
    this._validationErrors.delete(fieldName);
    this.requestUpdate();
  }

  /**
   * Handle file upload
   */
  _onFileChange(fieldName, files) {
    if (files.length > 0) {
      this.files[fieldName] = files[0];
      this.formData[fieldName] = files[0].name;
    }
  }

  /**
   * Validate form
   */
  validate() {
    this.validating = true;
    this._validationErrors.clear();
    
    const errors = [];
    
    for (const field of this.formStructure?.fields || []) {
      const value = this.formData[field.name];
      
      if (field.required && !value) {
        this._validationErrors.set(field.name, 'This field is required');
        errors.push(field.name);
      }
      
      // Custom validation
      if (field.validation && value) {
        try {
          const regex = new RegExp(field.validation);
          if (!regex.test(value)) {
            this._validationErrors.set(field.name, 'Invalid format');
            errors.push(field.name);
          }
        } catch (e) {
          // Invalid regex, skip
        }
      }
    }
    
    this.validating = false;
    return errors.length === 0;
  }

  /**
   * Submit form
   */
  async submit() {
    if (!this.validate()) {
      this.emit('validation-failed', { 
        errors: Object.fromEntries(this._validationErrors) 
      });
      return;
    }

    this.saving = true;
    
    try {
      // Build form data
      const formData = new FormData();
      
      // Add entity data
      const payload = {
        data: this.formData,
        instance: {
          _index: this.formIndex
        }
      };
      
      formData.append('data', JSON.stringify(payload));
      
      // Add files
      for (const [fieldName, file] of Object.entries(this.files)) {
        formData.append(fieldName, file);
      }

      // Submit
      const endpoint = this.mode === 'edit' 
        ? `/api/v1/entity/${this.entityId}`
        : '/api/v1/entity';
      
      const method = this.mode === 'edit' ? 'PUT' : 'POST';
      
      const response = await this.callApi(endpoint, {
        method,
        body: formData
      });

      this.emit('saved', { 
        mode: this.mode,
        entity: response.data,
        entityId: response.data?._id
      });
      
      this.close();
    } catch (err) {
      this.emit('error', { error: err });
    } finally {
      this.saving = false;
    }
  }

  /**
   * Render field based on type
   */
  renderField(field) {
    const value = this.formData[field.name] || '';
    const error = this._validationErrors.get(field.name);
    
    const commonProps = {
      class: `form-control ${error ? 'error' : ''}`,
      name: `data[${field.name}]`,
      placeholder: field.label,
      required: field.required,
      .value: ${value},
      @change: ${(e) => this._onFieldChange(field.name, e.target.value)}
    };

    switch (field.type) {
      case 'textarea':
        return html`
          <div class="form-group">
            <label class="form-label ${field.required ? 'required' : ''}">
              ${field.label}
            </label>
            <textarea 
              class="form-control ${error ? 'error' : ''}"
              name="data[${field.name}]"
              placeholder="${field.label}"
              ?required=${field.required}
              .value=${value}
              @change=${(e) => this._onFieldChange(field.name, e.target.value)}
            ></textarea>
            ${error ? html`<div class="form-error">⚠ ${error}</div>` : nothing}
          </div>
        `;

      case 'select':
        return html`
          <div class="form-group">
            <label class="form-label ${field.required ? 'required' : ''}">
              ${field.label}
            </label>
            <select 
              class="form-control ${error ? 'error' : ''}"
              name="data[${field.name}]"
              ?required=${field.required}
              @change=${(e) => this._onFieldChange(field.name, e.target.value)}
            >
              <option value="">Select...</option>
              ${field.options.map(opt => html`
                <option value="${opt.value}" ?selected=${value === opt.value}>
                  ${opt.label}
                </option>
              `)}
            </select>
            ${error ? html`<div class="form-error">⚠ ${error}</div>` : nothing}
          </div>
        `;

      case 'file':
        return html`
          <div class="form-group">
            <label class="form-label ${field.required ? 'required' : ''}">
              ${field.label}
            </label>
            <div class="file-upload" @click=${(e) => e.target.querySelector('input').click()}>
              <input 
                type="file"
                class="file-upload-input"
                @change=${(e) => this._onFileChange(field.name, e.target.files)}
              />
              <div>📎 Click or drag file here</div>
            </div>
            ${this.files[field.name] ? html`
              <div class="file-preview">
                <div class="file-info">
                  <div class="file-name">${this.files[field.name].name}</div>
                  <div class="file-name">${(this.files[field.name].size / 1024).toFixed(1)} KB</div>
                </div>
                <button class="file-remove" @click=${() => { delete this.files[field.name]; this.requestUpdate(); }}>×</button>
              </div>
            ` : nothing}
          </div>
        `;

      case 'checkbox':
        return html`
          <div class="form-check">
            <input 
              type="checkbox"
              class="form-check-input"
              name="data[${field.name}]"
              ?checked=${value}
              @change=${(e) => this._onFieldChange(field.name, e.target.checked)}
            />
            <label class="form-check-label">${field.label}</label>
          </div>
        `;

      default:
        return html`
          <div class="form-group">
            <label class="form-label ${field.required ? 'required' : ''}">
              ${field.label}
            </label>
            <input 
              type="${field.type}"
              class="form-control ${error ? 'error' : ''}"
              name="data[${field.name}]"
              placeholder="${field.label}"
              ?required=${field.required}
              .value=${value}
              @change=${(e) => this._onFieldChange(field.name, e.target.value)}
            />
            ${error ? html`<div class="form-error">⚠ ${error}</div>` : nothing}
          </div>
        `;
    }
  }

  /**
   * Render form content
   */
  renderForm() {
    if (this.loading) {
      return html`
        <div class="form-loading">
          <div class="form-loading-spinner"></div>
          Loading form...
        </div>
      `;
    }

    if (!this.formStructure) {
      return html`
        <div class="empty-state">
          <p>No form structure available</p>
        </div>
      `;
    }

    return html`
      <form @submit=${(e) => { e.preventDefault(); this.submit(); }}>
        ${this.formStructure.fields.map(field => this.renderField(field))}
      </form>
    `;
  }

  render() {
    if (!this.open) return nothing;

    return html`
      <div class="modal" @click=${(e) => e.target === e.currentTarget && this.close()}>
        <div class="modal-header">
          <div>
            <h3 class="modal-title">
              ${this.mode === 'create' ? 'Create New' : 'Edit'} ${this.formIndex}
            </h3>
            <div class="modal-subtitle">
              ${this.entityId ? `ID: ${this.entityId}` : 'New entity'}
            </div>
          </div>
          <button class="close-btn" @click=${this.close}>×</button>
        </div>
        
        <div class="modal-body">
          ${this.renderForm()}
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-secondary" @click=${this.close} ?disabled=${this.saving}>
            Cancel
          </button>
          <button class="btn btn-primary" @click=${this.submit} ?disabled=${this.saving}>
            ${this.saving ? html`
              <span class="form-loading-spinner" style="width: 16px; height: 16px; display: inline-block; margin: 0;"></span>
              Saving...
            ` : this.mode === 'create' ? 'Create' : 'Save Changes'}
          </button>
        </div>
      </div>
    `;
  }
}

customElements.define('dymer-form-modal', DymerFormModal);
export default DymerFormModal;
