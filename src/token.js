const { Consent } = require('./consent');

/**
 * Consent web token
 */
class CWT {
  constructor(userId = null, userIdType = null, userIdHashMethod = null, consents = []) {
    this.user_id = userId;
    this.user_id_type = userIdType;
    this.user_id_hash_method = userIdHashMethod;
    this.consents = consents.map(Consent.fromObject);
    this.version = 1;
  }

  toJSON() {
    return JSON.stringify({
      user_id: this.user_id,
      user_id_type: this.user_id_type,
      user_id_hash_method: this.user_id_hash_method,
      consents: this.consents,
      version: this.version,
    });
  }

  toBase64() {
    return new Buffer(this.toJSON()).toString('base64');
  }

  addConsent(purpose, vendorId, scopeId = null) {
    let consent = this.getConsent(purpose);

    if (!consent) {
      consent = new Consent(purpose);
      this.consents.push(consent);
    }

    consent.addVendor(vendorId, scopeId);
  }

  getConsent(purpose) {
    return this.consents.find(c => c.purpose === purpose);
  }

  hasConsent(purpose, vendorId = null, scopeId = null) {
    const consent = this.getConsent(purpose);

    if (consent) {
      // Consent found for that purpose

      if (!vendorId) {
        // We were not asked to check for a specific vendor
        // TODO: Check scope here
        return true;
      }

      // Check if consent was given for the specific vendor
      let vendor = consent.getVendor(vendorId);

      if (!vendor) {
        // Check if consent was given all vendors
        vendor = consent.getVendor('*');

        if (!vendor) {
          // Still no vendor
          return false;
        }
      }

      if (!scopeId) {
        // No scope to check
        return true;
      }

      // TODO: Check scope of * vs specific vendor if the scope doesn't match for one or the other
      return vendor.hasScope(scopeId, false);
    }

    return false;
  }
}

/**
 * Parse a JSON string into a CWT object
 * Returns null if the JSON does not represent a valid Consent Web Token.
 *
 * @param {*} string
 */
function CWTFromJSON(string) {
  if (!string) {
    return null;
  }

  let object;

  try {
    object = JSON.parse(string);
  } catch (error) {
    return null;
  }

  return new CWT(
    object.user_id,
    object.user_id_type,
    object.user_id_hash_method,
    object.consents
  );
}

/**
 * Parse a base64-encoded JSON string into a CWT object
 * Returns null if the value does not represent a valid Consent Web Token.
 *
 * @param {*} string
 */
function CWTFromBase64(string) {
  if (!string) {
    return null;
  }

  return CWTFromJSON(new Buffer(string, 'base64').toString());
}

module.exports = { CWT, CWTFromBase64, CWTFromJSON };
