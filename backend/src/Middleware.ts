import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWTSECRET!;

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.body.jwt;
    console.log(token);
  if (!token) return res.status(401).redirect("/admin");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log(decoded);
    if (decoded.role !== "admin") {
      return res.status(403).redirect("/admin");
    }
    console.log("MIDDLEWARE SUCCESSFUL");
    next();
  } catch {
    return res.status(401).redirect("/admin");
  }
}
