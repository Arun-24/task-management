import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    // ✅ Fix: ensure token is a string (not undefined)
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    if (typeof decoded === "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    const payload = decoded as JwtPayload;

    if (!payload?.id) {
      return res.status(401).json({ message: "Token missing user id" });
    }

    req.userId = payload.id as string;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
