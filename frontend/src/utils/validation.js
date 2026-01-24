export const getNameParts = (value) => {
  if (!value) return [];
  return value.trim().split(/\s+/).filter(Boolean);
};

export const isValidFullName = (value) => {
  return getNameParts(value).length >= 2;
};
