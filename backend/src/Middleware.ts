import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import multer from "multer";

const JWT_SECRET = process.env.JWTSECRET!;

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.body.jwt;
  
  // const jwtToken = req.headers.authorization!.split(" ")[1];
  console.log(token);
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log(decoded);
    if (decoded.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.log("MIDDLEWARE SUCCESSFUL");
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
const storage = multer.memoryStorage(); // Storing in memory. Can store on disk if desired
export const upload = multer({ storage });
