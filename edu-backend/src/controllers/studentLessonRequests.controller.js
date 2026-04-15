import pool from "../db.js";
import { scheduleHasLiveOfferingForScope } from "../utils/academicScope.js";
import { toSqlDateTime, isValidDateTimeStr } from "../utils/cairoTime.js";
import { getStudentContext, loadStudentSubjectTeacherBookingContext } from "../services/studentContext.service.js";
import { insertNotificationSafe } from "../services/notificationWrite.service.js";
import {
  badRequest,
  getAuthUserId,
  handleApiError,
  notFound,
  parsePositiveInt,
  unauthorized,
} from "./helpers/studentController.helpers.js";

const STUDENT_SCOPE_RESOLUTION_ERROR =
  "Student academic scope could not be resolved. Ensure students.system_id and students.stage_id are populated.";
const CANCEL_CUTOFF_HOURS = 2;

export async function requestLessonSessionHandler(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);

  const tId = parsePositiveInt(req.body?.teacherId);
  const sId = parsePositiveInt(req.body?.subjectId);
  const schId = parsePositiveInt(req.body?.scheduleId);
  const startsAt = req.body?.startsAt;
  const endsAt = req.body?.endsAt;

  if (!tId || !sId || !schId || !startsAt || !endsAt) {
    return badRequest(res, "Invalid or missing booking parameters.");
  }
  if (!isValidDateTimeStr(String(startsAt)) || !isValidDateTimeStr(String(endsAt))) {
    return badRequest(res, "startsAt/endsAt must be valid datetime strings.");
  }

  const startsSql = toSqlDateTime(String(startsAt));
  const endsSql = toSqlDateTime(String(endsAt));
  if (!startsSql || !endsSql) return badRequest(res, "Invalid startsAt/endsAt format.");
  if (startsSql >= endsSql) return badRequest(res, "startsAt must be before endsAt.");

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    const [[futureRow]] = await conn.query(`SELECT (? > NOW()) AS is_future`, [startsSql]);
    if (!Number(futureRow?.is_future)) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "startsAt must be in the future.");
    }

    const context = await getStudentContext(userId, conn);
    if (!context) {
      await conn.rollback();
      txStarted = false;
      return notFound(res, "Active student profile not found.");
    }
    const student = context.student;

    const bookingContext = await loadStudentSubjectTeacherBookingContext(student, {
      subjectId: sId,
      teacherId: tId,
      executor: conn,
      selectionRequiredMessage:
        "You must have this teacher selected for the subject before booking.",
      scopeErrorMessage: STUDENT_SCOPE_RESOLUTION_ERROR,
    });
    if (!bookingContext.ok) {
      await conn.rollback();
      txStarted = false;
      return res.status(bookingContext.status).json({
        success: false,
        message: bookingContext.message,
      });
    }

    const {
      teacherId: normalizedTeacherId,
      subjectId: normalizedSubjectId,
      systemId,
      stageId,
      gradeLevelId,
    } = bookingContext.context;

    await conn.query(`SELECT id FROM teachers WHERE id = ? LIMIT 1 FOR UPDATE`, [normalizedTeacherId]);
    await conn.query(`SELECT id FROM students WHERE id = ? LIMIT 1 FOR UPDATE`, [student.id]);

    const [[schedule]] = await conn.query(
      `
      SELECT id, weekday, start_time, end_time, is_group, max_students
      FROM teacher_schedules
      WHERE id = ?
        AND teacher_id = ?
        AND is_active = 1
      LIMIT 1
      FOR UPDATE
      `,
      [schId, normalizedTeacherId]
    );
    if (!schedule) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Invalid or inactive teacher schedule.");
    }
    if (Number(schedule.is_group) === 1) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Group slot booking is not yet supported.");
    }

    const [[wdRow]] = await conn.query(`SELECT (WEEKDAY(?) + 1) AS wd`, [startsSql]);
    if (Number(wdRow?.wd) !== Number(schedule.weekday)) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Selected time does not match the schedule weekday.");
    }

    const [[timeFit]] = await conn.query(`SELECT (TIME(?) >= ? AND TIME(?) <= ?) AS fits`, [
      startsSql,
      schedule.start_time,
      endsSql,
      schedule.end_time,
    ]);
    if (!timeFit || Number(timeFit.fits) !== 1) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Selected time is outside the teacher schedule slot.");
    }

    const offering = await scheduleHasLiveOfferingForScope(
      schId,
      normalizedSubjectId,
      systemId,
      stageId,
      gradeLevelId,
      conn
    );
    if (!offering) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Subject is not offered for your grade in this time slot.");
    }

    const [[duplicate]] = await conn.query(
      `
      SELECT 1
      FROM lesson_sessions
      WHERE student_id  = ?
        AND schedule_id = ?
        AND subject_id  = ?
        AND starts_at   = ?
        AND ends_at     = ?
        AND status IN ('pending', 'scheduled', 'approved')
      LIMIT 1
      `,
      [student.id, schId, normalizedSubjectId, startsSql, endsSql]
    );
    if (duplicate) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "You already have a pending request for this slot.");
    }

    const [[teacherConflict]] = await conn.query(
      `
      SELECT 1
      FROM lesson_sessions
      WHERE teacher_id = ?
        AND status IN ('pending','approved','scheduled')
        AND starts_at < ?
        AND ends_at   > ?
      LIMIT 1
      `,
      [normalizedTeacherId, endsSql, startsSql]
    );
    if (teacherConflict) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Teacher is not available at the selected time.");
    }

    const [[studentConflict]] = await conn.query(
      `
      SELECT 1
      FROM lesson_sessions
      WHERE student_id = ?
        AND status IN ('pending','approved','scheduled')
        AND starts_at < ?
        AND ends_at   > ?
      LIMIT 1
      `,
      [student.id, endsSql, startsSql]
    );
    if (studentConflict) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "You already have a lesson scheduled at this time.");
    }

    const [[blockedByException]] = await conn.query(
      `
      SELECT 1
      FROM teacher_schedule_exceptions
      WHERE teacher_id = ?
        AND is_active = 1
        AND exception_type = 'unavailable'
        AND exception_date = DATE(?)
        AND start_time < TIME(?)
        AND end_time   > TIME(?)
      LIMIT 1
      `,
      [normalizedTeacherId, startsSql, endsSql, startsSql]
    );
    if (blockedByException) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "This time is marked unavailable by the teacher.");
    }

    const [result] = await conn.query(
      `
      INSERT INTO lesson_sessions
        (teacher_id, subject_id, system_id, stage_id, grade_level_id, schedule_id,
         starts_at, ends_at, is_group, max_students,
         created_by_user_id, student_id, status)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `,
      [
        normalizedTeacherId,
        normalizedSubjectId,
        systemId,
        stageId,
        gradeLevelId,
        schId,
        startsSql,
        endsSql,
        schedule.is_group,
        schedule.max_students,
        userId,
        student.id,
      ]
    );
    const sessionId = result.insertId;

    const [[teacherUser]] = await conn.query(`SELECT user_id FROM teachers WHERE id = ? LIMIT 1`, [
      normalizedTeacherId,
    ]);
    if (teacherUser?.user_id) {
      await insertNotificationSafe(conn, {
        userId: teacherUser.user_id,
        type: "system",
        title: "New lesson request",
        body: `A student requested a lesson (#${sessionId}) pending your approval.`,
        relatedType: "lesson_session",
        relatedId: sessionId,
        extraData: { kind: "lesson_request", sessionId },
      });
    }

    await conn.commit();
    txStarted = false;
    return res.json({
      success: true,
      message: "Lesson request submitted and awaiting teacher approval.",
      data: { sessionId, status: "pending" },
    });
  } catch (err) {
    if (txStarted) {
      try {
        await conn.rollback();
      } catch {}
    }
    return handleApiError(res, err, "requestLessonSession");
  } finally {
    conn.release();
  }
}

export async function getMyPendingLessonRequestsHandler(req, res) {
  try {
    const requestedLimit = Number.parseInt(String(req.query?.limit ?? ""), 10);
    const requestedOffset = Number.parseInt(String(req.query?.offset ?? ""), 10);
    const limit = Number.isFinite(requestedLimit) && requestedLimit > 0 ? Math.min(requestedLimit, 100) : 50;
    const offset = Number.isFinite(requestedOffset) && requestedOffset >= 0 ? requestedOffset : 0;
    const userId = getAuthUserId(req);
    if (!userId) return unauthorized(res);

    const [[actor]] = await pool.query(`SELECT id, role, is_active FROM users WHERE id = ? LIMIT 1`, [userId]);
    if (!actor || Number(actor.is_active) !== 1) return unauthorized(res);
    if (actor.role !== "student" && actor.role !== "parent") {
      return badRequest(res, "Only students/parents can access pending lesson requests.");
    }

    let actorStudentId = null;
    let actorParentId = null;
    if (actor.role === "student") {
      const context = await getStudentContext(userId);
      if (!context) return notFound(res, "Active student profile not found.");
      actorStudentId = context.student.id;
    } else {
      const [[p]] = await pool.query(`SELECT id FROM parents WHERE user_id = ? LIMIT 1`, [userId]);
      if (!p?.id) return notFound(res, "Parent profile not found.");
      actorParentId = p.id;
    }

    let rows = [];
    if (actor.role === "student") {
      const [r] = await pool.query(
        `
        SELECT
          ls.id, ls.starts_at, ls.ends_at, ls.status, ls.cancel_reason,
          ls.student_id, suser.full_name AS student_name,
          subj.id AS subject_id, subj.name_en AS subject_name_en, subj.name_ar AS subject_name_ar,
          t.id AS teacher_id, t.name AS teacher_name, t.photo_url AS teacher_photo_url
        FROM lesson_sessions ls
        JOIN subjects subj ON subj.id = ls.subject_id
        JOIN teachers t    ON t.id    = ls.teacher_id
        LEFT JOIN students st ON st.id = ls.student_id
        LEFT JOIN users suser ON suser.id = st.user_id
        WHERE ls.status IN ('pending', 'scheduled', 'approved')
          AND ls.student_id = ?
        ORDER BY ls.starts_at ASC
        LIMIT ?
        OFFSET ?
        `,
        [actorStudentId, limit, offset]
      );
      rows = r || [];
    } else {
      const [r] = await pool.query(
        `
        SELECT
          ls.id, ls.starts_at, ls.ends_at, ls.status, ls.cancel_reason,
          ls.student_id, suser.full_name AS student_name,
          subj.id AS subject_id, subj.name_en AS subject_name_en, subj.name_ar AS subject_name_ar,
          t.id AS teacher_id, t.name AS teacher_name, t.photo_url AS teacher_photo_url
        FROM lesson_sessions ls
        JOIN subjects subj ON subj.id = ls.subject_id
        JOIN teachers t    ON t.id    = ls.teacher_id
        LEFT JOIN students st ON st.id = ls.student_id
        LEFT JOIN users suser ON suser.id = st.user_id
        WHERE ls.status IN ('pending', 'scheduled', 'approved')
          AND EXISTS (
            SELECT 1 FROM parent_students ps
            WHERE ps.parent_id = ? AND ps.student_id = ls.student_id
            LIMIT 1
          )
        ORDER BY ls.starts_at ASC
        LIMIT ?
        OFFSET ?
        `,
        [actorParentId, limit, offset]
      );
      rows = r || [];
    }

    const data = rows.map((r) => {
      const startsAt = r.starts_at ?? null;
      const endsAt = r.ends_at ?? null;
      const date = startsAt ? String(startsAt).slice(0, 10) : null;
      const startTime = startsAt ? String(startsAt).slice(11, 19) : null;
      const endTime = endsAt ? String(endsAt).slice(11, 19) : null;
      const timeWindow = startTime && endTime ? `${startTime}-${endTime}` : null;
      return {
        id: r.id,
        status: r.status,
        startsAt,
        endsAt,
        cancelReason: r.cancel_reason ?? null,
        date,
        timeWindow,
        teacherName: r.teacher_name ?? null,
        subjectNameEn: r.subject_name_en ?? null,
        subjectNameAr: r.subject_name_ar ?? null,
        student: r.student_id ? { id: r.student_id, name: r.student_name ?? null } : null,
        subject: { id: r.subject_id, nameEn: r.subject_name_en ?? null, nameAr: r.subject_name_ar ?? null },
        teacher: { id: r.teacher_id, name: r.teacher_name ?? null, photoUrl: r.teacher_photo_url ?? null },
      };
    });

    return res.json({ success: true, data, pagination: { limit, offset } });
  } catch (err) {
    return handleApiError(res, err, "getMyPendingLessonRequests");
  }
}

async function resolveActorForCancellation(conn, userId) {
  const [[actor]] = await conn.query(`SELECT role, is_active FROM users WHERE id = ? LIMIT 1`, [userId]);
  if (!actor || Number(actor.is_active) !== 1) return { ok: false, type: "unauthorized" };
  if (actor.role !== "student" && actor.role !== "parent") return { ok: false, type: "forbidden" };
  if (actor.role === "student") {
    const context = await getStudentContext(userId, conn);
    if (!context) return { ok: false, type: "student_not_found" };
    return { ok: true, role: actor.role, actorStudentId: context.student.id, actorParentId: null };
  }
  const [[p]] = await conn.query(`SELECT id FROM parents WHERE user_id = ? LIMIT 1`, [userId]);
  if (!p?.id) return { ok: false, type: "parent_not_found" };
  return { ok: true, role: actor.role, actorStudentId: null, actorParentId: p.id };
}

export async function cancelMyLessonRequestHandler(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);
  const sessionId = parsePositiveInt(req.params?.id);
  if (!sessionId) return badRequest(res, "Invalid session id.");
  const reasonRaw = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const reason = reasonRaw ? reasonRaw.slice(0, 250) : null;

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    const actor = await resolveActorForCancellation(conn, userId);
    if (!actor.ok) {
      await conn.rollback();
      txStarted = false;
      if (actor.type === "unauthorized") return unauthorized(res);
      if (actor.type === "forbidden") return badRequest(res, "Only students/parents can cancel lesson requests.");
      if (actor.type === "student_not_found") return notFound(res, "Active student profile not found.");
      return notFound(res, "Parent profile not found.");
    }

    const cancelledBy = actor.role === "parent" ? "parent" : "student";
    const [[session]] = await conn.query(
      `SELECT id, teacher_id, status, student_id FROM lesson_sessions WHERE id = ? FOR UPDATE`,
      [sessionId]
    );
    if (!session) {
      await conn.rollback();
      txStarted = false;
      return notFound(res, "Lesson request not found.");
    }
    if (session.status !== "pending") {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Only pending requests can be cancelled.");
    }

    if (actor.role === "student") {
      if (Number(session.student_id) !== Number(actor.actorStudentId)) {
        await conn.rollback();
        txStarted = false;
        return unauthorized(res, "You are not allowed to cancel this request.");
      }
    } else {
      const [[link]] = await conn.query(
        `SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ? LIMIT 1`,
        [actor.actorParentId, session.student_id]
      );
      if (!link) {
        await conn.rollback();
        txStarted = false;
        return unauthorized(res, "You are not allowed to cancel this request.");
      }
    }

    const [u1] = await conn.query(
      `
      UPDATE lesson_sessions
      SET status = 'cancelled',
          updated_by_user_id = ?,
          cancelled_by = ?,
          cancel_reason = COALESCE(?, cancel_reason),
          cancelled_at = NOW()
      WHERE id = ?
        AND status = 'pending'
      `,
      [userId, cancelledBy, reason, sessionId]
    );
    if (!u1 || u1.affectedRows === 0) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Unable to cancel this request (it may have changed).");
    }

    const [[teacherUser]] = await conn.query(`SELECT user_id FROM teachers WHERE id = ? LIMIT 1`, [
      session.teacher_id,
    ]);
    if (teacherUser?.user_id) {
      await insertNotificationSafe(conn, {
        userId: teacherUser.user_id,
        type: "system",
        title: "Lesson request cancelled",
        body: `A ${cancelledBy} cancelled lesson request (#${sessionId}).${reason ? ` Reason: ${reason}` : ""}`,
        relatedType: "lesson_session",
        relatedId: sessionId,
        extraData: { kind: "lesson_cancelled", sessionId, cancelledBy, reason: reason ?? null },
      });
    }

    await conn.commit();
    txStarted = false;
    return res.json({ success: true, message: "Lesson request cancelled.", data: { sessionId, status: "cancelled" } });
  } catch (err) {
    if (txStarted) {
      try {
        await conn.rollback();
      } catch {}
    }
    return handleApiError(res, err, "cancelMyLessonRequest");
  } finally {
    conn.release();
  }
}

export async function cancelMyScheduledSessionHandler(req, res) {
  const userId = getAuthUserId(req);
  if (!userId) return unauthorized(res);
  const sessionId = parsePositiveInt(req.params?.id);
  if (!sessionId) return badRequest(res, "Invalid session id.");
  const reasonRaw = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  const reason = reasonRaw ? reasonRaw.slice(0, 250) : null;

  const conn = await pool.getConnection();
  let txStarted = false;
  try {
    await conn.beginTransaction();
    txStarted = true;

    const actor = await resolveActorForCancellation(conn, userId);
    if (!actor.ok) {
      await conn.rollback();
      txStarted = false;
      if (actor.type === "unauthorized") return unauthorized(res);
      if (actor.type === "forbidden") return badRequest(res, "Only students/parents can cancel sessions.");
      if (actor.type === "student_not_found") return notFound(res, "Active student profile not found.");
      return notFound(res, "Parent profile not found.");
    }

    const cancelledBy = actor.role === "parent" ? "parent" : "student";
    const [[session]] = await conn.query(
      `SELECT id, teacher_id, status, student_id, starts_at FROM lesson_sessions WHERE id = ? FOR UPDATE`,
      [sessionId]
    );
    if (!session) {
      await conn.rollback();
      txStarted = false;
      return notFound(res, "Lesson session not found.");
    }
    if (session.status !== "scheduled" && session.status !== "approved") {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Only scheduled sessions can be cancelled with this endpoint.");
    }

    if (actor.role === "student") {
      if (Number(session.student_id) !== Number(actor.actorStudentId)) {
        await conn.rollback();
        txStarted = false;
        return unauthorized(res, "You are not allowed to cancel this session.");
      }
    } else {
      const [[link]] = await conn.query(
        `SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ? LIMIT 1`,
        [actor.actorParentId, session.student_id]
      );
      if (!link) {
        await conn.rollback();
        txStarted = false;
        return unauthorized(res, "You are not allowed to cancel this session.");
      }
    }

    const [[timeCheck]] = await conn.query(`SELECT (? > DATE_ADD(NOW(), INTERVAL ? HOUR)) AS is_eligible`, [
      session.starts_at,
      CANCEL_CUTOFF_HOURS,
    ]);
    if (!timeCheck?.is_eligible) {
      await conn.rollback();
      txStarted = false;
      return badRequest(
        res,
        `Cancellation is only allowed more than ${CANCEL_CUTOFF_HOURS} hours before the session starts.`
      );
    }

    const [u1] = await conn.query(
      `UPDATE lesson_sessions
          SET status       = 'cancelled',
              cancel_reason = COALESCE(?, cancel_reason),
              cancelled_by  = ?,
              cancelled_at  = NOW(),
              updated_by_user_id = ?
        WHERE id     = ?
          AND status IN ('scheduled', 'approved')`,
      [reason, cancelledBy, userId, sessionId]
    );
    if (!u1 || u1.affectedRows === 0) {
      await conn.rollback();
      txStarted = false;
      return badRequest(res, "Unable to cancel this session (it may have changed).");
    }

    const [[teacherUser]] = await conn.query(`SELECT user_id FROM teachers WHERE id = ? LIMIT 1`, [
      session.teacher_id,
    ]);
    if (teacherUser?.user_id) {
      await insertNotificationSafe(conn, {
        userId: teacherUser.user_id,
        type: "system",
        title: "Lesson session cancelled",
        body: `A ${cancelledBy} cancelled scheduled session (#${sessionId}).${reason ? ` Reason: ${reason}` : ""}`,
        relatedType: "lesson_session",
        relatedId: sessionId,
        extraData: { kind: "lesson_cancelled", sessionId, cancelledBy, reason: reason ?? null },
      });
    }

    await conn.commit();
    txStarted = false;
    return res.json({ success: true, message: "Lesson session cancelled.", data: { sessionId, status: "cancelled" } });
  } catch (err) {
    if (txStarted) {
      try {
        await conn.rollback();
      } catch {}
    }
    return handleApiError(res, err, "cancelMyScheduledSession");
  } finally {
    conn.release();
  }
}
