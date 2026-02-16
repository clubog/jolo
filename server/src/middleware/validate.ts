import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../types/common.js";

export function validate(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw ApiError.badRequest(message);
    }
    req.body = result.data;
    next();
  };
}
