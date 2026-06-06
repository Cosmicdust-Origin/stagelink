import { ApiError } from "@/lib/api/auth";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const monthPattern = /^\d{4}-\d{2}$/;

export function requireUuid(value: unknown, label = "id") {
  if (typeof value !== "string" || !uuidPattern.test(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return value;
}

export function optionalUuid(value: unknown, label = "id") {
  if (value == null || value === "") return undefined;
  return requireUuid(value, label);
}

export function optionalMonth(value: unknown, label = "month") {
  if (value == null || value === "") return undefined;
  if (typeof value !== "string" || !monthPattern.test(value)) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  const month = Number(value.slice(5, 7));
  if (month < 1 || month > 12) {
    throw new ApiError(400, `Invalid ${label}`);
  }

  return value;
}

export function requireDateString(value: unknown, label = "date") {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return value;
}

export function optionalDateString(value: unknown, label = "date") {
  if (value == null || value === "") return undefined;
  return requireDateString(value, label);
}

export function requireNonNegativeNumber(value: unknown, label = "number") {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return number;
}

export function requireNonNegativeInteger(value: unknown, label = "number") {
  const number = requireNonNegativeNumber(value, label);
  if (!Number.isInteger(number)) {
    throw new ApiError(400, `Invalid ${label}`);
  }
  return number;
}

