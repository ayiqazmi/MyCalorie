let reauthenticated = false;

export const setReauthenticated = (value) => {
  reauthenticated = value;
};

export const getReauthenticated = () => reauthenticated;
