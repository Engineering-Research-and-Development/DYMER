/**
 * EntityMixin - Shared CRUD logic for entity components
 * @version 2.0.0
 */

import { DymerElement } from '../core/dymer-element.js';

/**
 * Mixin that adds entity CRUD operations to a component
 */
export const EntityMixin = (Base) => class extends Base {
  static properties = {
    entityCache: { type: Map },
    pendingOperations: { type: Set }
  };

  constructor() {
    super();
    this.entityCache = new Map();
    this.pendingOperations = new Set();
  }

  /**
   * Get cached entity or fetch from API
   */
  async getEntity(id, useCache = true) {
    if (useCache && this.entityCache.has(id)) {
      return this.entityCache.get(id);
    }

    const response = await this.callApi(`/api/v1/entity/${id}`);
    const entity = response.data;
    
    if (useCache) {
      this.entityCache.set(id, entity);
    }
    
    return entity;
  }

  /**
   * Create new entity
   */
  async createEntity(data, options = {}) {
    const operationId = `create-${Date.now()}`;
    this.pendingOperations.add(operationId);
    
    try {
      const response = await this.callApi('/api/v1/entity', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      const entity = response.data;
      this.entityCache.set(entity._id, entity);
      
      this.emit('entity-created', { entity });
      return entity;
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Update entity
   */
  async updateEntity(id, data, options = {}) {
    const operationId = `update-${id}`;
    if (this.pendingOperations.has(operationId)) {
      throw new Error('Update already in progress');
    }
    
    this.pendingOperations.add(operationId);
    
    try {
      const response = await this.callApi(`/api/v1/entity/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      
      const entity = response.data;
      this.entityCache.set(id, entity);
      
      this.emit('entity-updated', { entity });
      return entity;
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Delete entity
   */
  async deleteEntity(id, options = {}) {
    const operationId = `delete-${id}`;
    this.pendingOperations.add(operationId);
    
    try {
      await this.callApi(`/api/v1/entity/${id}`, {
        method: 'DELETE'
      });
      
      this.entityCache.delete(id);
      this.emit('entity-deleted', { entityId: id });
    } finally {
      this.pendingOperations.delete(operationId);
    }
  }

  /**
   * Search entities
   */
  async searchEntities(query, options = {}) {
    const response = await this.callApi('/api/v1/entity/_search', {
      method: 'POST',
      body: JSON.stringify(query)
    });
    
    return {
      items: response.data,
      total: response.total
    };
  }

  /**
   * Clear entity cache
   */
  clearCache(id = null) {
    if (id) {
      this.entityCache.delete(id);
    } else {
      this.entityCache.clear();
    }
  }
};

export default EntityMixin;
