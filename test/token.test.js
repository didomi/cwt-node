const expect = require('chai').expect;
const { CWT, CWTFromBase64, CWTFromJSON } = require('../src/token');

describe('CWT - Token', function () {
  describe('CWTFromJSON', function () {
    it('Generates a CWT object from a JSON string', function () {
      const object = {
        issuer: 'didomi',
        user_id: 'user@domain.com',
        user_id_type: 'email',
        user_id_hash_method: null,
        consents: [],
      };

      const token = CWTFromJSON(JSON.stringify(object));

      expect(token).to.deep.equal(Object.assign({}, object, { version: 1 }));
    });

    it('Returns null if the JSON is not valid', function () {
      expect(CWTFromJSON());
      expect(CWTFromJSON(null));
      expect(CWTFromJSON(undefined));
      expect(CWTFromJSON(''));
      expect(CWTFromJSON('{'));
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

      expect(token).to.deep.equal(Object.assign({}, object, { version: 1 }));
    });

    it('Returns null if the JSON is not valid', function () {
      expect(CWTFromBase64());
      expect(CWTFromBase64(null));
      expect(CWTFromBase64(undefined));
      expect(CWTFromBase64(''));
      expect(CWTFromBase64('{}'));
      expect(CWTFromBase64((new Buffer('test').toString('base64'))));
    });
  });

  describe('CWT', function () {
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
        expect(token.toJSON()).to.equal(JSON.stringify(Object.assign({}, object, { version: 1 })));
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
        expect(token.toBase64()).to.equal((new Buffer(JSON.stringify(Object.assign({}, object, { version: 1 })))).toString('base64'));
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
});
