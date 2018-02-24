const expect = require('chai').expect;
const { Vendor } = require('../src/vendor');

describe('CWT - Vendor', function () {
  describe('addScope', function () {
    it('Adds a scope to a vendor with no scope', function () {
      const vendor = new Vendor('vendor');
      vendor.addScope('scope');

      expect(vendor.scopes).to.deep.equal(['scope']);
    });

    it('Adds a scope to a vendor with scopes', function () {
      const vendor = new Vendor('vendor', ['scope']);
      vendor.addScope('scope2');

      expect(vendor.scopes).to.deep.equal(['scope', 'scope2']);
    });

    it('Does not add a duplicate scope', function () {
      const vendor = new Vendor('vendor', ['scope']);
      vendor.addScope('scope');

      expect(vendor.scopes).to.deep.equal(['scope']);
    });

    it('Does nothing when adding an undefined scope', function () {
      const vendor = new Vendor('vendor', []);
      vendor.addScope('');
      vendor.addScope(null);
      vendor.addScope(undefined);

      expect(vendor.scopes).to.deep.equal([]);
    });
  });

  describe('hasScope', function () {
    it('returns true if the global scope is present', function () {
      const vendor = new Vendor('vendor', ['*']);
      expect(vendor.hasScope('test')).to.be.true;
      expect(vendor.hasScope('*')).to.be.true;
    });

    it('returns false if the global scope is present but the check disables it', function () {
      const vendor = new Vendor('vendor', ['*']);
      expect(vendor.hasScope('test', false)).to.be.false;
      expect(vendor.hasScope('*')).to.be.true;
    });

    it('returns true if the scope is present', function () {
      const vendor = new Vendor('vendor', ['scope']);
      expect(vendor.hasScope('scope')).to.be.true;
    });
  });

  describe('fromObject', function () {
    it('creates a Vendor from an object', function () {
      const object = {
        id: 'vendor',
        scopes: ['scope'],
      };

      const vendor = Vendor.fromObject(object);

      expect(vendor).to.deep.equal(object);
    });

    it('returns null if the object is invalid', function () {
      expect(Vendor.fromObject()).to.be.null;
      expect(Vendor.fromObject([])).to.be.null;
      expect(Vendor.fromObject('')).to.be.null;
      expect(Vendor.fromObject({})).to.be.null;
      expect(Vendor.fromObject({ test: 'test' })).to.be.null;
      expect(Vendor.fromObject({ id: [] })).to.be.null;
    });

    it('sets scopes to an empty array if it is invalid on the object', function () {
      expect(Vendor.fromObject({ id: 'vendor' }).scopes).to.deep.equal([]);
      expect(Vendor.fromObject({ id: 'vendor', scopes: {} }).scopes).to.deep.equal([]);
    });
  });
});
