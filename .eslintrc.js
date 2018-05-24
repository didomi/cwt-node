module.exports = {
  "extends": "airbnb-base",
  "plugins": [
      "import"
  ],
  "env": {
    "node": true
  },
  "rules": {
    "comma-dangle": [
      "error",
      {
        "arrays": "always-multiline",
        "objects": "always-multiline",
        "imports": "always-multiline",
        "exports": "always-multiline",
        "functions": "never"
      }
    ],

    "no-console": "error",
    "no-continue": "off",
    "no-prototype-builtins": "off",
    "max-len": ["error", 100, 2, {
      "ignoreUrls": true,
      "ignoreComments": true,
      "ignoreRegExpLiterals": true,
      "ignoreStrings": true,
      "ignoreTemplateLiterals": true,
    }],
    "no-underscore-dangle": "off",
    "no-param-reassign": "off",
    "guard-for-in": "off",
    "class-methods-use-this": "off",
    "func-names": "off",
    "no-restricted-syntax": [
      "error",
      {
        selector: "LabeledStatement",
        message: "Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.",
      },
      {
        selector: "WithStatement",
        message: "`with` is disallowed in strict mode because it makes code impossible to predict and optimize.",
      },
    ],
  }
};
