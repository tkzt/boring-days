export const hasValue = function checkTextfieldWhetherHasValue(modelValue) {
  return !!modelValue || modelValue === 0;
};

export default {
  hasValue,
};
