/**
 * @ignore
 */
const { Consent } = require('./consent');

/**
 * A consent web token represents the GDPR consents expressed by a user.
 * It can be used for storage or to be shared with third-parties.
 *
 * @example
 * const token = new CWT({
 *   issuer: 'issuer',
 *   user_id: 'user@domain.com',
 *   user_id_type: 'email'
 * });
 */
class CWT {
  /**
   * Create a new Consent web token
   *
   * @param {Object} tokenContent The content of the token
   * @param {string} tokenContent.issuer A unique ID identifying the issuer of the token
   * @param {string} [tokenContent.user_id] The ID of the user that owns the token
   * @param {string} [tokenContent.user_id_type] The type of ID (email, uuid, adid, etc.)
   * @param {string} [tokenContent.user_id_hash_method] If the user ID is hashed, this is the method used for generating the hash (md5, sha1, sha256)
   * @param {Object[]} [tokenContent.consents] A list of consents already given by the user
   */
  constructor(tokenContent) {
    tokenContent = tokenContent || {};

    /**
     * A unique ID identifying the issuer of the token
     *
     * @type {string}
     */
    this.issuer = tokenContent.issuer;

    /**
     * The ID of the user that owns the token
     *
     * @type {string}
     */
    this.user_id = tokenContent.user_id;

    /**
     * The type of ID (email, uuid, adid, etc.)
     *
     * @type {string}
     */
    this.user_id_type = tokenContent.user_id_type;

    /**
     * If the user ID is hashed, this is the method used for generating the hash (md5, sha1, sha256)
     *
     * @type {string}
     */
    this.user_id_hash_method = tokenContent.user_id_hash_method;

    /**
     * A list of consents already given by the user
     *
     * @type {Object[]}
     */
    this.consents = (tokenContent.consents || []).map(Consent.fromObject);

    /**
     * The CWT specification version
     *
     * @type {number}
     */
    this.version = 1;
  }

  /**
   * Export the token information as a plain JavaScript object
   *
   * @return {Object}
   */
  toObject() {
    return {
      issuer: this.issuer,
      user_id: this.user_id,
      user_id_type: this.user_id_type,
      user_id_hash_method: this.user_id_hash_method,
      consents: this.consents,
      version: this.version,
    };
  }

  /**
   * Generate a JSON-encoded version of the token
   *
   * @return {string}
   */
  toJSON() {
    return JSON.stringify(this.toObject());
  }

  /**
   * Generate a base64-encoded version of the token
   * It first encode the token as JSON then base64-encode it.
   *
   * @return {string}
   */
  toBase64() {
    return new Buffer(this.toJSON()).toString('base64');
  }

  /**
   * Add a consent given by the user
   *
   * @param {string} purpose The purpose for which the user has given consent
   * @param {string} vendorId The unique vendor ID for which the user has given consent. Use `*` to indicate that the user has given consent for all vendors)
   * @param {string} [scopeId] The scope for which the user has given consent (example: email, website, a unique internal ID, etc.). This is used to further limit the consent to a specific context as needed. It allows doing local (one website) vs global (all websites) consents easily. Use `*` to indicate that the user has given consent for any scope.
   *
   * @example
   * const token = new CWT('issuer');
   * token.addConsent(
   *   CWT.Purposes.Cookies,
   *   'didomi',
   *   '*'
   * );
   */
  addConsent(purpose, vendorId, scopeId = null) {
    let consent = this.getConsent(purpose);

    if (!consent) {
      consent = new Consent(purpose);
      this.consents.push(consent);
    }

    consent.addVendor(vendorId, scopeId);
  }

  /**
   * Get the consent given by a user for a given purpose
   *
   * @param {string} purpose
   * @return {Consent} The `Consent` object for the purpose or `null` if there is no consent for that purpose
   */
  getConsent(purpose) {
    return this.consents.find(c => c.purpose === purpose);
  }

  /**
   * Check if the user has given consent for a specific purpose, vendor and scope
   *
   * If the vendor or the scope are not provided, the function ignores them and simply checks if consent has been given for the purpose.
   * Make sure that you provide a vendor or scope to match the level of compliance you are targeting.
   * For instance, if you want to make sure that the user has given the most specific purpose, you'll want to include both the vendor and the scope in your query.
   *
   * @param {string} purpose Purpose
   * @param {string} [vendorId] Unique ID of the vendor to check consent for
   * @param {string} [scopeId] Scope to check consent for
   * @return {boolean}
   *
   * @example
   * const token = new CWT('issuer');
   * token.addConsent(CWT.Purposes.Cookies, 'didomi', '.didomi.io');
   * token.hasConsent(CWT.Purposes.Cookies, 'didomi');
   */
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
 *
 * @param {string} jsonString
 * @return {CWT|null} Return a CWT object or null if the JSON does not represent a valid Consent Web Token
 */
function CWTFromJSON(jsonString) {
  if (!jsonString) {
    return null;
  }

  let object;

  try {
    object = JSON.parse(jsonString);
  } catch (error) {
    return null;
  }

  return new CWT(object);
}

/**
 * Parse a base64-encoded JSON string into a CWT object
 *
 * @param {string} base64String
 * @return {CWT|null} Return a CWT object or null if the string does not represent a valid Consent Web Token
 */
function CWTFromBase64(base64String) {
  if (!base64String) {
    return null;
  }

  return CWTFromJSON(new Buffer(base64String, 'base64').toString());
}

/**
 * List of standard GDPR purposes
 *
 * This list is provided as part of the CWT specification but is not intended to be a complete/restrictive list. You are free to specify your own purposes. If you share tokens with third-parties though, they will need to know of to interpret your purpose IDs whereas you can expect them to know how to deal with the standard purposes provided here.
 */
const Purposes = {
  Cookies: 'cookies',
};

module.exports = {
  CWT,
  CWTFromBase64,
  CWTFromJSON,
  Purposes,
};
