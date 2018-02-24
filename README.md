# cwt-node
[![Build Status](https://travis-ci.org/didomi/cwt-node.svg?branch=master)](https://travis-ci.org/didomi/cwt-node)
[![Coverage Status](https://coveralls.io/repos/github/didomi/cwt-node/badge.svg?branch=master)](https://coveralls.io/github/didomi/cwt-node?branch=master)

An implementation of the [Consent web token](http://www.consentwebtoken.io/) specification.

A consent web token is a [JWT](https://jwt.io/) that has standardized consent claims and that can be used to represent user consent for data privacy regulations like GDPR or ePrivacy.

This library provides easy-to-use functions to:
 - Manage user consent (add, check and remove user consent from a token)
 - Encode/decode a token
 - Sign a token

```javascript
const { CWT, Purposes } = require('@didomi/consentwebtoken');

// Create a consent web token for a user
const token = new CWT({
  issuer: 'didomi',
  user_id: 'user@domain.com',
  user_id_type: 'email',
});

// Add a few consents
token.addConsent(Purposes.Cookies, 'didomi');
token.addConsent(Purposes.Cookies, 'liveramp');

// Check what consents have been set for the user
token.hasConsent(Purposes.Cookies, 'didomi');

// Encode the token for storage
token.toJSON();
```

---

**Table of Contents**

- [Installation](#installation)
- [Documentation](#documentation)
- [License](#license)
- [Sponsor](#sponsor)

## Installation

```javascript
npm install --save @didomi/consentwebtoken
```

The package has no peer dependency.

## Documentation

The API documentation is available here: https://didomi.github.io/cwt-node/

## License

MIT. See [LICENSE](LICENSE).

## Sponsor

<a href="https://www.didomi.io">
    <img src="https://www.didomi.io/wp-content/uploads/2017/01/cropped-didomi-horizontal-1.png" alt="Logo of Didomi" width="200" />
</a>

`cwt-node` is developed and maintained by [Didomi](https://www.didomi.io), an end-to-end solution for managing data privacy and user consent.
