import { Request, Response, NextFunction } from "express";

function stripMongoOperators(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripMongoOperators);
  }

  if (value !== null && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        continue;
      }
      cleaned[key] = stripMongoOperators(val);
    }
    return cleaned;
  }

  return value;
}

export function sanitizeRequestBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = stripMongoOperators(req.body);
  }
  next();
}
