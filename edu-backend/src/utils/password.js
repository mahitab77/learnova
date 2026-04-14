// src/utils/password.js
import crypto from "crypto";

const ITERATIONS = 10000;
const KEYLEN = 64;
const DIGEST = "sha512";

/**
 * Hash a plain password → returns "salt:hash"
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(key.toString("hex"));
    });
  });

  return `${salt}:${derivedKey}`;
}

/**
 * Compare plain password with stored "salt:hash"
 */
export async function verifyPassword(password, stored) {
  const [salt, originalHash] = stored.split(":");
  if (!salt || !originalHash) return false;

  const derivedKey = await new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, key) => {
      if (err) return reject(err);
      resolve(key.toString("hex"));
    });
  });

  return crypto.timingSafeEqual(
    Buffer.from(originalHash, "hex"),
    Buffer.from(derivedKey, "hex")
  );
}
