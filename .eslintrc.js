module.exports = {
    extends: 'airbnb-base',
    rules: {
      'no-console': 'off',
    },
    overrides: [
      {
        files: ['migrations/*.js'],
        rules: {
          'arrow-body-style': 'off',
        },
      },
    ],
    parserOptions: {
        sourceType: 'script',
    },
};