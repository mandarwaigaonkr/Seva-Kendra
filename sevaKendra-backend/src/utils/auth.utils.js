import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { appConfig } from "../config/appConfig.js";

if (appConfig.jwtSecret && appConfig.jwtSecret.length < 32) {
  console.warn("JWT_SECRET is shorter than 32 characters; use a long random value.");
}

const requireSecret = () => {
  if (!appConfig.jwtSecret) throw new Error("JWT_SECRET is not set");
  return appConfig.jwtSecret;
};

export const generateToken = async (data, expiryTime) => {
  const options = {
    algorithm: "HS256",
    expiresIn: expiryTime ?? "5d",
  };
  return jwt.sign({ ...data }, requireSecret(), options);
};

export const decodeToken = async (req, res) => {
  if (!req.headers.authorization?.startsWith("Bearer ")) {
    res.status(401).send({ message: "Not Authorized,No token" });
    return null;
  }

  const token = req.headers.authorization.split(" ")[1];
  if (!token) {
    res.status(401).send({ message: "Not Authorized,No token" });
    return null;
  }

  try {
    const decoded = jwt.verify(token, requireSecret(), { algorithms: ["HS256"] });
    return decoded || null;
  } catch (error) {
    res.status(401).send({ message: "Not Authorized" });
    return null;
  }
};

export const verifyValue = async (value, hashedValue) => {
  return await bcrypt.compare(value, hashedValue);
};
