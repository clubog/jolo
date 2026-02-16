import crypto from "node:crypto";
import type { RequestHandler } from "express";
import { config } from "../config.js";
import { ApiError } from "../types/common.js";

const SECRET = config.COOKIE_SECRET;

export function signToken(payload: string): string {
  const hmac = crypto.createHmac("sha256", SECRET);
  hmac.update(payload);
  return payload + "." + hmac.digest("hex");
}

export function verifyToken(token: string): boolean {
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;
  const payload = token.slice(0, dotIndex);
  return signToken(payload) === token;
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  const token = req.cookies?.admin_token;
  if (!token || !verifyToken(token)) {
    throw ApiError.unauthorized();
  }
  next();
};
