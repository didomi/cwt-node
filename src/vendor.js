/**
 * Vendor
 *
 * A vendor for which consent can be collected
 *
 * @ignore
 */
class Vendor {
  constructor(id, scopes = []) {
    this.id = id;
    this.scopes = scopes;
  }

  static fromObject(object) {
    if (!object) {
      return null;
    }

    if (
      typeof object.id !== 'string'
      || !object.id
    ) {
      return null;
    }

    return new Vendor(
      object.id,
      Array.isArray(object.scopes) ? object.scopes : []
    );
  }

  addScope(scopeId) {
    if (!scopeId) {
      return;
    }

    if (this.scopes.indexOf(scopeId) !== -1) {
      return;
    }

    this.scopes.push(scopeId);
  }

  hasScope(scopeId, global = true) {
    if (global && this.scopes.indexOf('*') !== -1) {
      // Global scope, all scopes are set to true
      return true;
    }

    return this.scopes.indexOf(scopeId) !== -1;
  }
}

module.exports = { Vendor };
