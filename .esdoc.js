module.exports = {
  source: './src',
  destination: './docs',
  plugins: [
    {
      name: 'esdoc-standard-plugin',
      option: {
        unexportedIdentifier: {
          enable: true
        },
      },
    },
  ]
};
