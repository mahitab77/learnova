export async function insertNotificationSafe(
  conn,
  {
    userId,
    type = "system",
    title,
    body = null,
    relatedType = "other",
    relatedId = null,
    extraData = null,
    onError = null,
  }
) {
  try {
    const uid = Number(userId);
    if (!Number.isFinite(uid) || uid <= 0) return;

    const safeTitle =
      typeof title === "string" && title.trim()
        ? title.trim().slice(0, 255)
        : null;
    if (!safeTitle) return;

    const safeBody =
      typeof body === "string" && body.trim() ? body.trim() : null;

    const allowedTypes = new Set([
      "homework_due",
      "quiz_due",
      "grade_posted",
      "announcement",
      "system",
    ]);
    const allowedRelatedTypes = new Set([
      "homework",
      "quiz",
      "announcement",
      "subject",
      "teacher",
      "lesson_session",
      "other",
    ]);

    const safeType = allowedTypes.has(type) ? type : "system";
    const safeRelatedType = allowedRelatedTypes.has(relatedType)
      ? relatedType
      : "other";

    const safeRelatedId =
      relatedId === null || relatedId === undefined
        ? null
        : Number.isFinite(Number(relatedId)) && Number(relatedId) > 0
          ? Number(relatedId)
          : null;

    let safeExtra = null;
    if (extraData !== null && extraData !== undefined) {
      if (typeof extraData === "string") {
        safeExtra = extraData.slice(0, 10000);
      } else {
        try {
          safeExtra = JSON.stringify(extraData).slice(0, 10000);
        } catch {
          safeExtra = null;
        }
      }
    }

    try {
      await conn.query(
        `
        INSERT INTO notifications
          (user_id, type, title, body, related_type, related_id, extra_data, is_read, created_at)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, 0, NOW())
        `,
        [uid, safeType, safeTitle, safeBody, safeRelatedType, safeRelatedId, safeExtra]
      );
    } catch (err) {
      if (err && (err.code === "ER_BAD_FIELD_ERROR" || err.errno === 1054)) {
        await conn.query(
          `
          INSERT INTO notifications
            (user_id, type, title, body, related_type, related_id, is_read, created_at)
          VALUES
            (?, ?, ?, ?, ?, ?, 0, NOW())
          `,
          [uid, safeType, safeTitle, safeBody, safeRelatedType, safeRelatedId]
        );
      } else {
        throw err;
      }
    }
  } catch (err) {
    if (typeof onError === "function") onError(err);
  }
}
