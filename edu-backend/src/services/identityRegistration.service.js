import crypto from "crypto";
import { hashPassword } from "../utils/password.js";
import {
  AcademicScopeValidationError,
  normalizeRegistrationAcademicScope,
} from "../utils/academicScope.js";

export { AcademicScopeValidationError };

export class IdentityRegistrationError extends Error {
  constructor(message, { code = "IDENTITY_REGISTRATION_ERROR", status = 400, field } = {}) {
    super(message);
    this.name = "IdentityRegistrationError";
    this.code = code;
    this.status = status;
    this.field = field;
  }
}

export async function createStudentIdentity(conn, input) {
  const {
    fullName,
    email,
    password,
    preferredLang,
    normalizeEmail,
    scopeInput,
  } = input;

  const cleanEmail = normalizeEmail(email);
  // Registration steady-state contract is canonical scope IDs only.
  // Legacy gradeStage/gradeNumber payloads are rejected in this path.
  const normalizedScope = await normalizeRegistrationAcademicScope(
    scopeInput || {},
    conn,
    { requireSystemStage: true, allowLegacyFallback: false }
  );

  const [rows] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
    cleanEmail,
  ]);
  if (rows.length > 0) {
    throw new IdentityRegistrationError("Email already registered.", {
      status: 409,
      code: "EMAIL_ALREADY_EXISTS",
      field: "email",
    });
  }

  const passwordHash = await hashPassword(password);
  const studentLang = preferredLang === "en" ? "en" : "ar";

  const [userResult] = await conn.query(
    `
    INSERT INTO users (full_name, email, password_hash, role, preferred_lang, is_active)
    VALUES (?, ?, ?, 'student', ?, 1)
    `,
    [fullName, cleanEmail, passwordHash, studentLang]
  );
  const userId = userResult.insertId;

  const [studentResult] = await conn.query(
    `
    INSERT INTO students (
      user_id,
      system_id,
      stage_id,
      grade_level_id,
      onboarding_completed
    )
    VALUES (?, ?, ?, ?, 0)
    `,
    [userId, normalizedScope.systemId, normalizedScope.stageId, normalizedScope.gradeLevelId]
  );

  return {
    userId,
    studentId: studentResult.insertId,
    cleanEmail,
    studentLang,
    normalizedScope,
  };
}

export async function createParentWithChildrenIdentities(conn, input) {
  const { parent, children, contactOption, normalizeEmail } = input;
  const { fullName, email, password, phone, preferredLang, notes } = parent;

  const cleanParentEmail = normalizeEmail(email);
  const [existingParentRows] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
    cleanParentEmail,
  ]);
  if (existingParentRows.length > 0) {
    throw new IdentityRegistrationError(
      "This parent email is already registered. If you already have an account, please log in instead.",
      { status: 409, code: "PARENT_EMAIL_EXISTS", field: "email" }
    );
  }

  const parentPasswordHash = await hashPassword(password);
  const parentLang = preferredLang === "en" ? "en" : "ar";

  const [parentUserResult] = await conn.query(
    `
    INSERT INTO users (full_name, email, password_hash, role, preferred_lang, is_active)
    VALUES (?, ?, ?, 'parent', ?, 1)
    `,
    [fullName, cleanParentEmail, parentPasswordHash, parentLang]
  );
  const parentUserId = parentUserResult.insertId;

  const [parentRowResult] = await conn.query(
    `
    INSERT INTO parents (user_id, phone, notes)
    VALUES (?, ?, ?)
    `,
    [parentUserId, phone || null, notes || null]
  );
  const parentId = parentRowResult.insertId;

  const normalizedContactOption = contactOption === "individual" ? "individual" : "parent";
  const createdChildren = [];

  for (const child of children) {
    const {
      fullName: childName,
      email: childEmail,
      password: childPassword,
      relationship,
      preferredLang: childLang,
      gender,
      subjectIds,
    } = child;

    const normalizedScope = await normalizeRegistrationAcademicScope(child, conn, {
      requireSystemStage: true,
      allowLegacyFallback: false,
    });

    const finalChildLang = childLang === "en" ? "en" : parentLang;
    const rel = relationship || "mother";
    const normalizedGender = gender === "male" || gender === "female" ? gender : null;
    const childSubjectIds = Array.isArray(subjectIds)
      ? subjectIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n > 0)
      : [];
    const hasOwnLogin = normalizedContactOption === "individual" ? 1 : 0;

    let childUserId = null;
    let exposedChildEmail = cleanParentEmail;

    if (normalizedContactOption === "individual") {
      const cleanChildEmail = normalizeEmail(childEmail);
      const [existingChildRows] = await conn.query("SELECT id FROM users WHERE email = ? LIMIT 1", [
        cleanChildEmail,
      ]);
      if (existingChildRows.length > 0) {
        throw new IdentityRegistrationError(
          `Child email is already registered: ${cleanChildEmail}. Please use a different email or choose 'Use parent contacts' instead.`,
          { status: 409, code: "CHILD_EMAIL_EXISTS", field: "childEmail" }
        );
      }

      const childPasswordHash = await hashPassword(childPassword);
      const [childUserResult] = await conn.query(
        `
        INSERT INTO users (full_name, email, password_hash, role, preferred_lang, is_active)
        VALUES (?, ?, ?, 'student', ?, 1)
        `,
        [childName, cleanChildEmail, childPasswordHash, finalChildLang]
      );
      childUserId = childUserResult.insertId;
      exposedChildEmail = cleanChildEmail;
    } else {
      const disabledLoginPasswordHash = await hashPassword(crypto.randomBytes(32).toString("hex"));
      const [childUserResult] = await conn.query(
        `
        INSERT INTO users (full_name, email, password_hash, role, preferred_lang, is_active)
        VALUES (?, NULL, ?, 'student', ?, 1)
        `,
        [childName, disabledLoginPasswordHash, finalChildLang]
      );
      childUserId = childUserResult.insertId;
    }

    if (!childUserId) {
      throw new Error(
        `INTERNAL: childUserId not resolved for child '${childName}' – cannot create student row without a linked user identity.`
      );
    }

    const [studentResult] = await conn.query(
      `
      INSERT INTO students (
        user_id,
        system_id,
        stage_id,
        grade_level_id,
        gender,
        onboarding_completed
      )
      VALUES (?, ?, ?, ?, ?, 0)
      `,
      [
        childUserId,
        normalizedScope.systemId,
        normalizedScope.stageId,
        normalizedScope.gradeLevelId,
        normalizedGender,
      ]
    );
    const studentId = studentResult.insertId;

    await conn.query(
      `
      INSERT INTO parent_students (parent_id, student_id, relationship, has_own_login)
      VALUES (?, ?, ?, ?)
      `,
      [parentId, studentId, rel, hasOwnLogin]
    );

    if (childSubjectIds.length > 0) {
      const valuesSql = childSubjectIds.map(() => "(?, ?)").join(", ");
      const params = [];
      childSubjectIds.forEach((sid) => params.push(studentId, sid));
      await conn.query(
        `
        INSERT INTO student_subjects (student_id, subject_id)
        VALUES ${valuesSql}
        `,
        params
      );
    }

    createdChildren.push({
      studentId,
      studentUserId: childUserId,
      fullName: childName,
      email: exposedChildEmail,
      hasOwnLogin: hasOwnLogin === 1,
      contactType: normalizedContactOption,
      systemId: normalizedScope.systemId,
      stageId: normalizedScope.stageId,
      gradeLevelId: normalizedScope.gradeLevelId,
      relationship: rel,
      gender: normalizedGender,
      subjectIds: childSubjectIds,
    });
  }

  return {
    parentUserId,
    parentId,
    parentLang,
    cleanParentEmail,
    normalizedContactOption,
    createdChildren,
  };
}
