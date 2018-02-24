const expect = require('chai').expect;
const { Consent } = require('../src/consent');

describe('CWT - Consent', function () {
  describe('addVendor', function () {
    it('Adds a vendor', function () {
      const consent = new Consent('purpose');
      consent.addVendor('vendor');

      expect(consent).to.deep.equal({
        purpose: 'purpose',
        vendors: [{
          id: 'vendor',
          scopes: [],
        }],
      });
    });

    it('Adds a scope to a vendor if it is already there', function () {
      const consent = new Consent(
        'purpose',
        [{
          id: 'vendor',
          scopes: ['scope1'],
        }]
      );
      consent.addVendor('vendor', 'scope2');

      expect(consent).to.deep.equal({
        purpose: 'purpose',
        vendors: [{
          id: 'vendor',
          scopes: ['scope1', 'scope2'],
        }],
      });
    });
  });

  describe('getVendor', function () {
    it('Returns a vendor', function () {
      const consent = new Consent(
        'purpose',
        [{
          id: 'vendor',
          scopes: ['scope1'],
        }]
      );

      expect(consent.getVendor('vendor')).to.exist;
    });

    it('Returns null if there is no matching vendor', function () {
      const consent = new Consent(
        'purpose',
        [{
          id: 'vendor',
          scopes: ['scope1'],
        }]
      );

      expect(consent.getVendor('vendor2')).to.be.undefined;
    });
  });

  describe('fromObject', function () {
    it('creates a Consent from an object', function () {
      const object = {
        purpose: 'purpose',
        vendors: [{
          id: 'vendor',
          scopes: [],
        }],
      };

      const consent = Consent.fromObject(object);

      expect(consent).to.deep.equal(object);
    });

    it('returns null if the object is invalid', function () {
      expect(Consent.fromObject()).to.be.null;
      expect(Consent.fromObject([])).to.be.null;
      expect(Consent.fromObject('')).to.be.null;
      expect(Consent.fromObject({})).to.be.null;
      expect(Consent.fromObject({ test: 'test' })).to.be.null;
      expect(Consent.fromObject({ purpose: [] })).to.be.null;
    });

    it('sets vendors to an empty array if it is invalid on the object', function () {
      expect(Consent.fromObject({ purpose: 'purpose' }).vendors).to.deep.equal([]);
      expect(Consent.fromObject({ purpose: 'purpose', vendors: {} }).vendors).to.deep.equal([]);
    });
  });
});
