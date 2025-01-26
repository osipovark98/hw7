import Joi from "joi";

export const validatePageNumber = (
  value: string,
  helpers: Joi.CustomHelpers
) => {
  const parsedValue = parseInt(value);
  if (!Number.isFinite(parsedValue)) return 1;
  if (parsedValue !== Number(helpers.original)) return 1;
  if (parsedValue < 0) return 1;
  return parsedValue;
};

export const validatePageSize = (value: string, helpers: Joi.CustomHelpers) => {
  const parsedValue = parseInt(value);
  if (!Number.isFinite(parsedValue)) return 10;
  if (parsedValue !== Number(helpers.original)) return 10;
  if (parsedValue < 0) return 10;
  return parsedValue;
};

export const validateSortBy = (validValues: string[]) => {
  return (value: string, helpers: Joi.CustomHelpers) => {
    const defaultValue = "createdAt";
    if (validValues.includes(value)) return value;
    else return defaultValue;
  };
};

export const validateSortDirection = (
  value: string,
  helpers: Joi.CustomHelpers
) => {
  const validValues = ["desc", "asc"];
  const defaultValue = "desc";
  if (validValues.includes(value)) return value;
  else return defaultValue;
};
