/**
 * Modern DYMER - Entry Point
 * Replaces legacy utility.js with Lit-based Web Components
 * @version 2.0.0
 * @author DYMER Team
 */

// Core exports
export { DymerElement } from './core/dymer-element.js';
export { TemplateEngine } from './core/template-engine.js';
export { TemplateLoader, getTemplateLoader, setTemplateLoader } from './core/template-loader.js';

// Component exports
export { DymerEntityCard } from './components/dymer-entity-card.js';
export { DymerEntityList } from './components/dymer-entity-list.js';
export { DymerFormModal } from './components/dymer-form-modal.js';
export { DymerFilterPanel } from './components/dymer-filter-panel.js';

// Mixin exports
export { EntityMixin } from './mixins/entity-mixin.js';
export { AuthMixin } from './mixins/auth-mixin.js';
export { PaginationMixin } from './mixins/pagination-mixin.js';

// Utility exports
export { ApiClient, ApiError, getApiClient } from './utils/api-client.js';
export { TemplateCompiler } from './utils/template-compiler.js';

/**
 * Initialize modern DYMER with global configuration
 */
export function initDymer(config = {}) {
  window.kmsconfig = { ...window.kmsconfig, ...config };
  
  const { getTemplateLoader } = await import('./core/template-loader.js');
  const loader = getTemplateLoader({
    baseUrl: config.serverUrl || '',
    debug: config.debug || false
  });

  console.log('[ModernDymer] Initialized', config);
  return { loader };
}

// Legacy compatibility
export const LegacyCompat = {
  kmsrenderEl: async (entities, viewType) => {
    const container = document.querySelector(kmsconf?.target?.[viewType]?.id);
    if (!container) {
      console.warn('[ModernDymer] Target container not found');
      return;
    }

    if (customElements.get('dymer-entity-list')) {
      container.innerHTML = `<dymer-entity-list view-type="${viewType}"></dymer-entity-list>`;
    }
  },

  loadModelListToModal: async (target, index, action) => {
    const modal = document.createElement('dymer-form-modal');
    document.body.appendChild(modal);
    await modal.openModal({ mode: 'create', formIndex: index });
    return modal;
  }
};

if (typeof window !== 'undefined') {
  window.ModernDymer = { init: initDymer, ...LegacyCompat };
}

export default { init: initDymer, ...LegacyCompat };
