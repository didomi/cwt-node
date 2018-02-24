/**
 * @ignore
 */
const { Vendor } = require('./vendor');

/**
 * Consent information collected for a specific purpose
 *
 * @example
 * const consent = new Consent(Purposes.Cookies, [
 *   {
 *     id: 'didomi',
 *     scopes: ['.didomi.io'],
 *   },
 * ]);
 *
 * @ignore
 */
class Consent {
  /**
   * Create a new Consent
   *
   * @param {string} purpose The purpose for which consent has been given
   * @param {string} [vendors] The vendors for which consent has been given (for that specific purpose)
   */
  constructor(purpose, vendors = []) {
    this.purpose = purpose;
    this.vendors = vendors.map(Vendor.fromObject);
  }

  /**
   * Add a new vendor to the consent, to indicate that the user has given consent for the pair (purpose, vendor)
   *
   * @param {string} vendorId Unique ID of the vendor
   * @param {string} [scopeId] Unique ID of the scope
   */
  addVendor(vendorId, scopeId = null) {
    let vendor = this.getVendor(vendorId);

    if (!vendor) {
      vendor = new Vendor(vendorId);
      this.vendors.push(vendor);
    }

    if (scopeId) {
      vendor.addScope(scopeId);
    }
  }

  getVendor(id) {
    return this.vendors.find(v => v.id === id);
  }

  static fromObject(object) {
    if (!object) {
      return null;
    }

    if (
      typeof object.purpose !== 'string'
      || !object.purpose
    ) {
      return null;
    }

    return new Consent(
      object.purpose,
      Array.isArray(object.vendors) ? object.vendors : []
    );
  }
}

module.exports = { Consent };
