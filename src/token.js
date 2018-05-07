const base64 = require('base-64');

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
    this.issuer = tokenContent.issuer || null;

    /**
     * The ID of the user that owns the token
     *
     * @type {string}
     */
    this.user_id = tokenContent.user_id || null;

    /**
     * The type of ID (email, uuid, adid, etc.)
     *
     * @type {string}
     */
    this.user_id_type = tokenContent.user_id_type || null;

    /**
     * If the user ID is hashed, this is the method used for generating the hash (md5, sha1, sha256)
     *
     * @type {string}
     */
    this.user_id_hash_method = tokenContent.user_id_hash_method || null;

    /**
     * A list of consents already given by the user
     *
     * @type {Object[]}
     */
    this.consents = tokenContent.consents || [];

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
    return base64.encode(this.toJSON());
  }

  /**
   * Set the consent status for the user
   *
   * @param {string} status The consent status (yes/no) of the user for the vendor
   * @param {string} purpose The purpose for which the user has given consent
   * @param {string} vendorId The unique vendor ID for which the user has given consent. Use `*` to indicate that the user has given consent for all vendors)
   *
   * @example
   * const token = new CWT('issuer');
   * token.setConsentStatus(
   *   true,
   *   CWT.Purposes.Cookies,
   *   'didomi'
   * );
   */
  setConsentStatus(status, purpose, vendorId) {
    // Check if we already have consent information for that purpose
    let consent = this.consents.find(c => c.purpose === purpose);

    if (!consent) {
      consent = {
        purpose,
        vendors: [],
      };

      this.consents.push(consent);
    }

    // Check if we already have the vendor for that consent
    let vendor = consent.vendors.find(v => v.id === vendorId);

    if (!vendor) {
      vendor = {
        id: vendorId,
        status: undefined,
      };

      consent.vendors.push(vendor);
    }

    vendor.status = status;
  }

  /**
   * Get the consent status of the user for a specific purpose/vendor
   *
   * Returns true if consent has been given, false if consent has been denied and undefined if no consent information is available
   *
   * @param {string} purpose Purpose
   * @param {string} vendorId Unique ID of the vendor to check consent for
   * @return {boolean}
   *
   * @example
   * const token = new CWT('issuer');
   * token.setConsentStatus(CWT.Purposes.Cookies, 'didomi');
   * token.getConsentStatus(CWT.Purposes.Cookies, 'didomi');
   */
  getConsentStatus(purpose, vendorId) {
    const consent = this.consents.find(c => c.purpose === purpose);

    if (consent) {
      // Consent information found for that purpose

      // Check if we have consent information for the specific vendor
      const vendor = consent.vendors.find(v => v.id === vendorId);
      if (vendor) {
        return vendor.status;
      }

      // We do not have consent information for that vendor, check if we have some for '*' (all vendors)
      const vendorCatchAll = consent.vendors.find(v => v.id === '*');
      if (vendorCatchAll) {
        return vendorCatchAll.status;
      }
    }

    return undefined;
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

  try {
    return CWTFromJSON(base64.decode(base64String));
  } catch (e) {
    return null;
  }
}

/**
 * List of standard GDPR/ePrivacy purposes
 *
 * This list is provided as part of the CWT specification but is not intended to be a complete/restrictive list. You are free to specify your own purposes. If you share tokens with third-parties though, they will need to know how to interpret your purpose IDs whereas you can expect them to know how to deal with the standard purposes provided here.
 */
const Purposes = {
  Cookies: 'cookies',
  CookiesAnalytics: 'cookies_analytics',
  CookiesMarketing: 'cookies_marketing',
  CookiesSocial: 'cookies_social',

  /**
   * Purposes from the IAB GDPR Transparency and consent framework
   * From http://advertisingconsent.eu/wp-content/uploads/2018/03/Transparency_Consent_Framework_FAQ_Formatted_v1_8-March-2018.pdf
   * Subject to change
   */

  // Advertising personalisation allow processing of a user’s data to provide and inform personalised advertising (including delivery, measurement, and reporting) based on a user’s preferences or interests known or inferred from data collected across multiple sites, apps, or devices; and/or accessing or storing information on devices for that purpose
  AdvertisingPersonalization: 'advertising_personalization',

  // Analytics allow processing of a user’s data to deliver content or advertisements and measure the delivery of such content or advertisements, extract insights and generate reports to understand service usage; and/or accessing or storing information on devices for that purpose
  Analytics: 'analytics',

  // Content personalisation allow processing of a user’s data to provide and inform personalised content (including delivery, measurement, and reporting) based on a user’s preferences or interests known or inferred from data collected across multiple sites, apps, or devices; and/or accessing or storing information on devices for that purpose.
  ContentPersonalization: 'content_personalization',

  // Accessing a device allow storing or accessing information on a user’s device
  DeviceAccess: 'device_access',

  // Matching data to offline sources combining data from offline sources that were initially collected in other contexts
  OfflineMatch: 'offline_match',

  // Linking devices allow processing of a user’s data to connect such user across multiple devices
  LinkDevices: 'link_devices',

  // Precise geographic location data allow processing of a user’s precise geographic location data in support of a purpose for which that certain third party has consent
  PreciseGeo: 'precise_geo',
};

module.exports = {
  CWT,
  CWTFromBase64,
  CWTFromJSON,
  Purposes,
};
