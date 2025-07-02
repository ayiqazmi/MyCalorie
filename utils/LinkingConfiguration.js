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
    },
  },
};
