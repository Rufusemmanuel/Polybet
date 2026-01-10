import 'server-only';

export const redactSignature = (value: string) =>
  value.length > 24 ? `${value.slice(0, 12)}...${value.slice(-10)}` : value;

export const redactApiKey = (value: string) => {
  if (value.length <= 8) return `${value.slice(0, 2)}...`;
  return `${value.slice(0, 5)}...${value.slice(-3)}`;
};
