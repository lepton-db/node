
export const isNum = field => typeof field == 'number';
export const isStr = field => typeof field == 'string';
export const isBool = field => typeof field == 'boolean';
export const isInt = field => Number.isInteger(field);
export const isIso = field => field == new Date(field).toISOString();
export const isEnum = (...values) => field => values.includes(field);
