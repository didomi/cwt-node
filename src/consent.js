const { Vendor } = require('./vendor');

class Consent {
  constructor(purpose, vendors = []) {
    this.purpose = purpose;
    this.vendors = vendors.map(Vendor.fromObject);
  }

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
