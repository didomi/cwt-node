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
   * Generate a space-efficient JSON CWT with less information
   */
  toCompressedJSON() {
    const token = this.toObject();

    const serializedToken = {
      issuer: token.issuer,
      user_id: token.user_id,
      user_id_type: token.user_id_type,
      user_id_hash_method: token.user_id_hash_method,
      version: token.version,
    };

    serializedToken.purposes = {
      enabled: [],
      disabled: [],
    };
    serializedToken.vendors = {
      enabled: [],
      disabled: [],
    };

    const statusByVendor = {};
    const vendorsByPurpose = {};

    // Find purposes that are all false (ie disabled purposes)
    for (const consentIndex in token.consents) {
      if (!token.consents.hasOwnProperty(consentIndex)) {
        continue;
      }

      const { purpose, vendors } = token.consents[consentIndex];

      vendorsByPurpose[purpose] = {};

      let disabledPurpose = true;
      for (const vendorIndex in vendors) {
        if (!vendors.hasOwnProperty(vendorIndex)) {
          continue;
        }

        const vendor = vendors[vendorIndex];

        disabledPurpose = disabledPurpose && vendor.status === false;

        if (!statusByVendor[vendor.id]) {
          statusByVendor[vendor.id] = {
            id: vendor.id,
            purposes: {},
          };
        }

        statusByVendor[vendor.id].purposes[purpose] = vendor.status;
        vendorsByPurpose[purpose][vendor.id] = vendor.status;
      }

      if (disabledPurpose) {
        // All vendors are set to false for this purpose, which means the purpose itself should be false
        serializedToken.purposes.disabled.push(purpose);
      } else {
        serializedToken.purposes.enabled.push(purpose);
      }
    }

    // Find vendors that have all true for enabled purposes and set them to true
    // Set the other vendors to false
    const vendorIdStrings = Object.keys(statusByVendor);
    for (const vendorIdStringIndex in vendorIdStrings) {
      if (!vendorIdStrings.hasOwnProperty(vendorIdStringIndex)) {
        continue;
      }

      const vendorIdString = vendorIdStrings[vendorIdStringIndex];
      let enabledVendor = true;

      for (const purposeIdIndex in serializedToken.purposes.enabled) {
        if (!serializedToken.purposes.enabled.hasOwnProperty(purposeIdIndex)) {
          continue;
        }

        const purposeId = serializedToken.purposes.enabled[purposeIdIndex];

        enabledVendor = enabledVendor
          && statusByVendor[vendorIdString].purposes[purposeId] === true;
      }

      if (enabledVendor) {
        serializedToken.vendors.enabled.push(statusByVendor[vendorIdString].id);
      } else {
        serializedToken.vendors.disabled.push(statusByVendor[vendorIdString].id);
      }
    }

    return JSON.stringify(serializedToken);
  }

  /**
   * Generate a base64-encoded version of the token
   * It first encode the token as JSON then base64-encode it.
   */
  toBase64() {
    return base64.encode(this.toJSON());
  }

  /**
   * Generate a base64-encoded version of compressed JSON token
   */
  toCompressedBase64() {
    return base64.encode(this.toCompressedJSON());
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

  if (object.purposes || object.vendors) {
    // It's a compressed JSON, do not use it
    return null;
  }

  return new CWT(object);
}

/**
 * Parse a compressed JSON string into a CWT object
 *
 * @param {string} jsonString
 * @return {CWT|null} Return a CWT object or null if the JSON does not represent a valid Consent Web Token
 */
function CWTFromCompressedJSON(jsonString) {
  if (!jsonString) {
    return null;
  }

  let object;

  try {
    object = JSON.parse(jsonString);
  } catch (error) {
    return null;
  }

  if (
    object.consents
    || !object.purposes
    || !object.vendors
    || !object.purposes.enabled
    || !object.purposes.disabled
    || !object.vendors.enabled
    || !object.vendors.disabled
  ) {
    return null;
  }

  const token = new CWT({
    issuer: object.issuer,
    user_id: object.user_id,
    user_id_type: object.user_id_type,
    user_id_hash_method: object.user_id_hash_method,
    consents: [],
    version: object.version,
  });

  for (const purposeIdIndex in object.purposes.enabled) {
    if (!object.purposes.enabled.hasOwnProperty(purposeIdIndex)) {
      continue;
    }

    const purposeId = object.purposes.enabled[purposeIdIndex];

    for (const vendorIdIndex in object.vendors.enabled) {
      if (!object.vendors.enabled.hasOwnProperty(vendorIdIndex)) {
        continue;
      }

      const vendorId = object.vendors.enabled[vendorIdIndex];

      token.setConsentStatus(true, purposeId, vendorId);
    }

    for (const vendorIdIndex in object.vendors.disabled) {
      if (!object.vendors.disabled.hasOwnProperty(vendorIdIndex)) {
        continue;
      }

      const vendorId = object.vendors.disabled[vendorIdIndex];

      token.setConsentStatus(false, purposeId, vendorId);
    }
  }

  for (const purposeIdIndex in object.purposes.disabled) {
    if (!object.purposes.disabled.hasOwnProperty(purposeIdIndex)) {
      continue;
    }

    const purposeId = object.purposes.disabled[purposeIdIndex];

    for (const vendorIdIndex in object.vendors.enabled) {
      if (!object.vendors.enabled.hasOwnProperty(vendorIdIndex)) {
        continue;
      }

      const vendorId = object.vendors.enabled[vendorIdIndex];

      token.setConsentStatus(false, purposeId, vendorId);
    }

    for (const vendorIdIndex in object.vendors.disabled) {
      if (!object.vendors.disabled.hasOwnProperty(vendorIdIndex)) {
        continue;
      }

      const vendorId = object.vendors.disabled[vendorIdIndex];

      token.setConsentStatus(false, purposeId, vendorId);
    }
  }

  return token;
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
 * Parse a base64-encoded JSON string into a CWT object
 *
 * @param {string} base64String
 * @return {CWT|null} Return a CWT object or null if the string does not represent a valid Consent Web Token
 */
function CWTFromCompressedBase64(base64String) {
  if (!base64String) {
    return null;
  }

  try {
    return CWTFromCompressedJSON(base64.decode(base64String));
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
  CWTFromCompressedBase64,
  CWTFromJSON,
  CWTFromCompressedJSON,
  Purposes,
};
