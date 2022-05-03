const signedInKey = 'bd-signed-in';

export const getSigned = () => localStorage.getItem(signedInKey)
|| sessionStorage.getItem(signedInKey);

export const removeSigned = () => {
  localStorage.removeItem(signedInKey);
  sessionStorage.removeItem(signedInKey);
};

export default { getSigned, removeSigned };
