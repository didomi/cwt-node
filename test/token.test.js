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

    describe('addConsent', function () {
      it('adds a consent to a token', function () {
        const token = new CWT();

        token.addConsent('cookies', 'vendor');

        expect(token.consents).to.deep.equal([
          {
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              scopes: [],
            }],
          },
        ]);
      });

      it('adds a vendor to an existing consent', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [],
          }],
        });

        token.addConsent('cookies', 'vendor');

        expect(token.consents).to.deep.equal([
          {
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              scopes: [],
            }],
          },
        ]);
      });

      it('adds a scope to an existing consent', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              scopes: ['scope1'],
            }],
          }],
        });

        token.addConsent('cookies', 'vendor', 'scope2');

        expect(token.consents).to.deep.equal([
          {
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              scopes: ['scope1', 'scope2'],
            }],
          },
        ]);
      });
    });

    describe('getConsent', function () {
      it('returns a consent from the list', function () {
        const token = new CWT();
        token.addConsent('cookies', 'vendor');

        expect(token.getConsent('cookies')).to.deep.equal({
          purpose: 'cookies',
          vendors: [{
            id: 'vendor',
            scopes: [],
          }],
        });
      });

      it('returns null if there is no matching consent', function () {
        const token = new CWT();
        expect(token.getConsent('cookies')).to.be.undefined;
      });
    });

    describe('hasConsent', function () {
      it('returns false if there is no matching consent', function () {
        const token = new CWT();
        expect(token.hasConsent('cookies')).to.be.false;
      });

      it('returns true if there is a matching consent and no vendor requirement', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [],
          }],
        });

        expect(token.hasConsent('cookies')).to.be.true;
      });

      it('returns true if consent has been given for a specific vendor', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
            }],
          }],
        });

        expect(token.hasConsent('cookies', 'vendor')).to.be.true;
      });

      it('returns true if consent has been given for all vendors', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [{
              id: '*',
            }],
          }],
        });

        expect(token.hasConsent('cookies', 'vendor')).to.be.true;
      });

      it('returns false if consent has been given but not for our vendor', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
            }],
          }],
        });

        expect(token.hasConsent('cookies', 'vendor-not-matching')).to.be.false;
      });

      it('returns true if consent has been given for a specific vendor and the right scope', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              scopes: ['scope'],
            }],
          }],
        });

        expect(token.hasConsent('cookies', 'vendor', 'scope')).to.be.true;
      });

      it('returns false if consent has been given for a specific vendor but not the right scope', function () {
        const token = new CWT({
          consents: [{
            purpose: 'cookies',
            vendors: [{
              id: 'vendor',
              scopes: ['*'],
            }],
          }],
        });

        expect(token.hasConsent('cookies', 'vendor', 'scope')).to.be.false;
      });
    });
  });
});
