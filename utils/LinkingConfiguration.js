// utils/LinkingConfiguration.js
export default {
  prefixes: ['mycalorie://'],
  config: {
    screens: {
      ResetPassword: {
        path: 'reset',
        parse: {
          oobCode: (code) => `${code}`,
          mode: (mode) => mode,
        },
      },
      // No need to define VerifyEmail screen if you're not using it
    },
  },
};
