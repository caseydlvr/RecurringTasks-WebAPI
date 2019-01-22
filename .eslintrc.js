module.exports = {
    extends: 'airbnb-base',
    overrides: [
      {
        files: ['migrations/*.js'],
        rules: {
          'arrow-body-style': 'off'
        },
      },
    ],
    parserOptions: {
        sourceType: 'script',
    },
};