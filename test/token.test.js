const expect = require('chai').expect;
const {
  CWT,
  CWTFromBase64,
  CWTFromCompressedBase64,
  CWTFromCompressedJSON,
  CWTFromJSON,
  toV2Compressed,
  toV2NonCompressed,
} = require('../src/token');

describe('CWT - Token', function () {
  describe('CWTFromJSON', function () {
    it('Generates a CWT object from a JSON string without consent', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [],
        version: 2,
      };

      const token = CWTFromJSON(JSON.stringify(object));

      expect(token).to.deep.equal(Object.assign(object, { version: 2 }));
    });

    it('Generates a CWT object from a JSON string', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [
          {
            purpose: 'cookies',
            vendors: [{
              id: '*',
              status: true,
            }],
          },
        ],
        version: 2,
      };

      const token = CWTFromJSON(JSON.stringify(object));

      expect(token).to.deep.equal(Object.assign(object, { version: 2 }));
    });

    it('Returns null if the JSON is not valid', function () {
      expect(CWTFromJSON()).to.be.null;
      expect(CWTFromJSON(null)).to.be.null;
      expect(CWTFromJSON(undefined)).to.be.null;
      expect(CWTFromJSON('')).to.be.null;
      expect(CWTFromJSON('{')).to.be.null;
    });

    it('Ignores compressed JSON', function () {
      expect(CWTFromJSON(JSON.stringify({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        purposes: {
          enabled: ['purpose', 'purpose3'],
          disabled: ['purpose2'],
        },
        vendors: {
          enabled: ['vendor'],
          disabled: ['vendor2', 'vendor3'],
        },
        version: 2,
      }))).to.be.null;
    });

    it('Can decode and upgrade a v1 token', function () {
      expect(CWTFromJSON(JSON.stringify({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [
          {
            purpose: 'cookies',
            vendors: [{
              id: '*',
              status: true,
            }],
          },
        ],
        version: 1,
      }))).to.deep.equal({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [
          {
            purpose: 'cookies',
            status: true,
            vendors: [{
              id: '*',
              status: true,
            }],
          },
        ],
        version: 2,
      });
    });
  });

  describe('CWTFromCompressedJSON', function () {
    it('Generates a CWT object from a JSON string without consent', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        purposes: {
          enabled: [],
          disabled: [],
        },
        vendors: {
          enabled: [],
          disabled: [],
        },
        version: 2,
      };

      const token = CWTFromCompressedJSON(JSON.stringify(object));

      expect(token).to.deep.equal({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        version: 2,
        consents: [],
      });
    });

    it('Generates a CWT object from a JSON string', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        purposes: {
          enabled: ['purpose', 'purpose3'],
          disabled: ['purpose2'],
        },
        vendors: {
          enabled: ['vendor'],
          disabled: ['vendor2', 'vendor3'],
        },
        version: 2,
      };

      const token = CWTFromCompressedJSON(JSON.stringify(object));

      expect(token).to.deep.equal({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        version: 2,
        consents: [
          {
            purpose: 'purpose',
            status: true,
            vendors: [
              {
                id: 'vendor',
                status: true,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
          {
            purpose: 'purpose3',
            status: true,
            vendors: [
              {
                id: 'vendor',
                status: true,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
          {
            purpose: 'purpose2',
            status: false,
            vendors: [
              {
                id: 'vendor',
                status: false,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
        ],
      });
    });

    it('Returns null if the JSON is not valid', function () {
      expect(CWTFromCompressedJSON()).to.be.null;
      expect(CWTFromCompressedJSON(null)).to.be.null;
      expect(CWTFromCompressedJSON(undefined)).to.be.null;
      expect(CWTFromCompressedJSON('')).to.be.null;
      expect(CWTFromCompressedJSON('{')).to.be.null;
    });

    it('Ignores non-compressed JSON', function () {
      expect(CWTFromCompressedJSON(JSON.stringify({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [],
        version: 2,
      }))).to.be.null;
    });

    it('Can decode and upgrade a v1 token', function () {
      expect(CWTFromCompressedJSON(JSON.stringify({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        purposes: {
          enabled: ['purpose', 'purpose3'],
          disabled: ['purpose2'],
        },
        vendors: {
          enabled: ['vendor'],
          disabled: ['vendor2', 'vendor3'],
        },
        version: 1,
      }))).to.deep.equal({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        version: 2,
        consents: [
          {
            purpose: 'purpose',
            status: true,
            vendors: [
              {
                id: 'vendor',
                status: true,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
          {
            purpose: 'purpose3',
            status: true,
            vendors: [
              {
                id: 'vendor',
                status: true,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
          {
            purpose: 'purpose2',
            status: false,
            vendors: [
              {
                id: 'vendor',
                status: false,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
        ],
      });
    });
  });

  describe('CWTFromBase64', function () {
    it('Generates a CWT object from a Base64 string', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [],
      };

      const token = CWTFromBase64((new Buffer(JSON.stringify(object))).toString('base64'));

      expect(token).to.deep.equal(Object.assign({}, object, { version: 2 }));
    });

    it('Returns null if the string is not valid', function () {
      expect(CWTFromBase64()).to.be.null;
      expect(CWTFromBase64(null)).to.be.null;
      expect(CWTFromBase64(undefined)).to.be.null;
      expect(CWTFromBase64('')).to.be.null;
      expect(CWTFromBase64('{}')).to.be.null;
      expect(CWTFromBase64((new Buffer('test').toString('base64')))).to.be.null;
      expect(CWTFromBase64((new Buffer(JSON.stringify({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        purposes: {
          enabled: ['purpose', 'purpose3'],
          disabled: ['purpose2'],
        },
        vendors: {
          enabled: ['vendor'],
          disabled: ['vendor2', 'vendor3'],
        },
      })).toString('base64')))).to.be.null;
    });
  });

  describe('CWTFromCompressedBase64', function () {
    it('Generates a CWT object from a compressed Base64 string', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        purposes: {
          enabled: ['purpose', 'purpose3'],
          disabled: ['purpose2'],
        },
        vendors: {
          enabled: ['vendor'],
          disabled: ['vendor2', 'vendor3'],
        },
      };

      const token = CWTFromCompressedBase64((new Buffer(JSON.stringify(object))).toString('base64'));

      expect(token).to.deep.equal({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        version: 2,
        consents: [
          {
            purpose: 'purpose',
            status: true,
            vendors: [
              {
                id: 'vendor',
                status: true,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
          {
            purpose: 'purpose3',
            status: true,
            vendors: [
              {
                id: 'vendor',
                status: true,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
          {
            purpose: 'purpose2',
            status: false,
            vendors: [
              {
                id: 'vendor',
                status: false,
              },
              {
                id: 'vendor2',
                status: false,
              },
              {
                id: 'vendor3',
                status: false,
              },
            ],
          },
        ],
      });
    });

    it('Returns null if the string is not valid', function () {
      expect(CWTFromCompressedBase64()).to.be.null;
      expect(CWTFromCompressedBase64(null)).to.be.null;
      expect(CWTFromCompressedBase64(undefined)).to.be.null;
      expect(CWTFromCompressedBase64('')).to.be.null;
      expect(CWTFromCompressedBase64('{}')).to.be.null;
      expect(CWTFromCompressedBase64((new Buffer('test').toString('base64')))).to.be.null;
      expect(CWTFromCompressedBase64((new Buffer(JSON.stringify({
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [],
      })).toString('base64')))).to.be.null;
    });
  });

  describe('CWT', function () {
    it('sets default values', function () {
      expect(new CWT()).to.deep.equal({
        issuer: null,
        user_id: null,
        user_id_type: null,
        user_id_hash_method: null,
        consents: [],
        version: 2,
      });

      expect(new CWT({
        issuer: 'didomi',
        consents: null,
      })).to.deep.equal({
        issuer: 'didomi',
        user_id: null,
        user_id_type: null,
        user_id_hash_method: null,
        consents: [],
        version: 2,
      });
    });

    describe('toJSON', function () {
      it('returns a JSON-encoded string', function () {
        const object = {
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          consents: [],
        };

        const token = new CWT(object);
        expect(token.toJSON()).to.equal(JSON.stringify(Object.assign({}, object, { version: 2 })));
      });
    });

    describe('toCompressedJSON', function () {
      it('returns a JSON-encoded string without consents', function () {
        const object = {
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          consents: [],
        };

        const token = new CWT(object);
        expect(token.toCompressedJSON()).to.equal(JSON.stringify({
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          version: 2,
          purposes: {
            enabled: [],
            disabled: [],
          },
          vendors: {
            enabled: [],
            disabled: [],
          },
        }));
      });

      it('returns a JSON-encoded string with the consents correctly encoded', function () {
        const object = {
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          consents: [],
        };

        const token = new CWT(object);

        // All true
        token.setPurposeStatus('purpose', true);
        token.setConsentStatus(true, 'purpose', 'vendor');
        token.setConsentStatus(true, 'purpose', 'vendor2');
        token.setConsentStatus(true, 'purpose', 'vendor3');

        // All false
        token.setPurposeStatus('purpose2', false);
        token.setConsentStatus(false, 'purpose2', 'vendor');
        token.setConsentStatus(false, 'purpose2', 'vendor2');
        token.setConsentStatus(false, 'purpose2', 'vendor3');

        // Some true / some false
        token.setPurposeStatus('purpose3', true);
        token.setConsentStatus(true, 'purpose3', 'vendor');
        token.setConsentStatus(false, 'purpose3', 'vendor2');
        token.setConsentStatus(false, 'purpose3', 'vendor3');

        expect(token.toCompressedJSON()).to.equal(JSON.stringify({
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          version: 2,
          purposes: {
            enabled: ['purpose', 'purpose3'],
            disabled: ['purpose2'],
          },
          vendors: {
            enabled: ['vendor'],
            disabled: ['vendor2', 'vendor3'],
          },
        }));
      });
    });

    describe('toBase64', function () {
      it('returns a Base64-encoded string', function () {
        const object = {
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          consents: [],
        };

        const token = new CWT(object);
        expect(token.toBase64()).to.equal((new Buffer(JSON.stringify(Object.assign({}, object, { version: 2 })))).toString('base64'));
      });
    });

    describe('toCompressedBase64', function () {
      it('returns a Base64-encoded string', function () {
        const object = {
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          consents: [],
        };

        const token = new CWT(object);
        expect(token.toCompressedBase64()).to.equal((new Buffer(JSON.stringify({
          issuer: 'didomi',
          user_id: 'user@domain.com',
          user_id_type: 'email',
          user_id_hash_method: null,
          version: 2,
          purposes: {
            enabled: [],
            disabled: [],
          },
          vendors: {
            enabled: [],
            disabled: [],
          },
        }))).toString('base64'));
      });
    });

    describe('setConsentStatus', function () {
      it('sets consent status in a token', function () {
        const token = new CWT();
        token.setConsentStatus(true, 'cookies', 'vendor');

        expect(token.consents).to.deep.equal([
          {
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              status: true,
            }],
          },
        ]);
      });

      it('sets consent status even if there is already information for that purpose/vendor', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [
              {
                id: 'vendor',
                status: false,
              },
            ],
          }],
        });

        token.setConsentStatus(true, 'cookies', 'vendor');

        expect(token.consents).to.deep.equal([
          {
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              status: true,
            }],
          },
        ]);
      });
    });

    describe('getConsentStatus', function () {
      it('returns a consent status from the list', function () {
        const token = new CWT();
        token.setConsentStatus(true, 'cookies', 'vendor');

        expect(token.getConsentStatus('cookies', 'vendor')).to.deep.equal(true);
      });

      it('returns a consent status from the vendor catch-all if it is present', function () {
        const token = new CWT();
        token.setConsentStatus(true, 'cookies', '*');

        expect(token.getConsentStatus('cookies', 'vendor')).to.deep.equal(true);
      });

      it('returns undefined if there is no matching consent', function () {
        const token = new CWT();
        expect(token.getConsentStatus('cookies', 'vendor')).to.be.undefined;
      });

      it('returns undefined if there is no matching vendor', function () {
        const token = new CWT();
        token.setConsentStatus(true, 'cookies', 'vendor2');

        expect(token.getConsentStatus('cookies', 'vendor')).to.be.undefined;
      });
    });
  });

  describe('toV2Compressed', function () {
    it('returns null if it\'s null', function () {
      expect(toV2Compressed(null)).to.be.null;
    });

    it('returns null if it\'s not a v1', function () {
      expect(toV2Compressed({
        version: 2,
      })).to.be.null;
    });

    it('updates the version flag', function () {
      expect(toV2Compressed({
        version: 1,
      })).to.deep.equal({ version: 2 });
    });
  });

  describe('toV2NonCompressed', function () {
    it('returns null if it\'s null', function () {
      expect(toV2NonCompressed(null)).to.be.null;
    });

    it('returns null if it\'s not a v1', function () {
      expect(toV2NonCompressed({
        version: 2,
      })).to.be.null;
    });

    it('updates the version flag', function () {
      expect(toV2NonCompressed({
        version: 1,
      })).to.have.property('version', 2);
    });

    it('infers purpose status true from consents', function () {
      expect(toV2NonCompressed({
        version: 1,
        user_id: 'user',
        consents: [
          {
            purpose: 'cookies',
            vendors: [
              {
                id: '*',
                status: true,
              },
            ],
          },
        ],
      })).to.deep.equal({
        version: 2,
        user_id: 'user',
        consents: [
          {
            purpose: 'cookies',
            status: true,
            vendors: [
              {
                id: '*',
                status: true,
              },
            ],
          },
        ],
      });
    });

    it('infers purpose status false from consents', function () {
      expect(toV2NonCompressed({
        version: 1,
        user_id: 'user',
        consents: [
          {
            purpose: 'cookies',
            vendors: [
              {
                id: '*',
                status: false,
              },
            ],
          },
        ],
      })).to.deep.equal({
        version: 2,
        user_id: 'user',
        consents: [
          {
            purpose: 'cookies',
            status: false,
            vendors: [
              {
                id: '*',
                status: false,
              },
            ],
          },
        ],
      });
    });
  });
});
