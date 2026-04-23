/**
 * AuthMixin - Authentication and authorization logic
 * @version 2.0.0
 */

/**
 * Mixin that adds auth capabilities to a component
 */
export const AuthMixin = (Base) => class extends Base {
  static properties = {
    authState: { type: Object },
    permissions: { type: Array }
  };

  constructor() {
    super();
    this.authState = this._loadAuthState();
    this.permissions = [];
  }

  /**
   * Load auth state from storage
   */
  _loadAuthState() {
    const token = localStorage.getItem('DYMAT') || localStorage.getItem('DYM');
    const d_uid = localStorage.getItem('d_uid');
    const d_gid = localStorage.getItem('d_gid');
    const d_rl = localStorage.getItem('d_rl');
    const d_lp = localStorage.getItem('d_lp');

    return {
      isAuthenticated: !!token,
      userId: d_uid,
      groupId: d_gid,
      roles: d_rl ? JSON.parse(atob(d_rl)) : [],
      permissions: d_lp ? JSON.parse(atob(d_lp)) : {}
    };
  }

  /**
   * Check if user has role
   */
  hasRole(role) {
    return this.authState.roles.includes(role);
  }

  /**
   * Check if user has permission for action on entity type
   */
  hasPermission(action, entityType) {
    const perms = this.authState.permissions[action] || [];
    return perms.includes(entityType) || perms.includes('*');
  }

  /**
   * Check if user is owner of entity
   */
  isOwner(entity) {
    return entity?.properties?.owner?.uid === this.authState.userId;
  }

  /**
   * Check if user can edit entity
   */
  canEdit(entity) {
    return this.hasRole('app-admin') ||
           this.isOwner(entity) ||
           this.hasPermission('edit', entity?._index);
  }

  /**
   * Check if user can delete entity
   */
  canDelete(entity) {
    return this.hasRole('app-admin') ||
           this.isOwner(entity) ||
           this.hasPermission('delete', entity?._index);
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('DYM');
    localStorage.removeItem('DYMAT');
    localStorage.removeItem('DYM_EXTRA');
    localStorage.removeItem('d_uid');
    localStorage.removeItem('d_gid');
    localStorage.removeItem('d_rl');
    localStorage.removeItem('d_lp');
    
    this.authState = { isAuthenticated: false, roles: [], permissions: {} };
    this.emit('auth-logout');
  }

  /**
   * Refresh auth token
   */
  async refreshToken() {
    try {
      const response = await this.callApi('/api2/retriveinfo', {
        method: 'POST'
      });
      
      // Update stored values
      if (response.DYM) localStorage.setItem('DYM', response.DYM);
      if (response.d_uid) localStorage.setItem('d_uid', response.d_uid);
      if (response.d_gid) localStorage.setItem('d_gid', response.d_gid);
      if (response.d_rl) localStorage.setItem('d_rl', response.d_rl);
      if (response.d_lp) localStorage.setItem('d_lp', response.d_lp);
      
      this.authState = this._loadAuthState();
      this.emit('auth-refresh', { auth: this.authState });
    } catch (err) {
      this.emit('auth-error', { error: err });
    }
  }
};

export default AuthMixin;
