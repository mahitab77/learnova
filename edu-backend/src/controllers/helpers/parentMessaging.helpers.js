import pool from "../../db.js";

export async function loadAnnouncementsForAudience(audience) {
  const [rows] = await pool.query(
    `
    SELECT id, title, body, audience, created_at
    FROM announcements
    WHERE audience IN ('all', ?)
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [audience]
  );

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    audience: r.audience,
    createdAt: r.created_at,
  }));
}

export async function loadNotificationsForUser(userId) {
  const [countRows] = await pool.query(
    `
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE user_id = ?
      AND is_read = 0
    `,
    [userId]
  );

  const unreadCount = countRows?.[0]?.unread_count || 0;

  const [items] = await pool.query(
    `
    SELECT id, type, title, body, related_type, related_id, is_read, read_at, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 50
    `,
    [userId]
  );

  return {
    unreadCount,
    items: items.map((r) => ({
      id: r.id,
      type: r.type,
      title: r.title,
      body: r.body,
      relatedType: r.related_type,
      relatedId: r.related_id,
      isRead: !!r.is_read,
      readAt: r.read_at ?? null,
      createdAt: r.created_at ?? null,
    })),
  };
}

export async function markNotificationReadForUser(notificationId, userId) {
  const [result] = await pool.query(
    `
      UPDATE notifications
      SET is_read = 1, read_at = NOW()
      WHERE id = ?
        AND user_id = ?
      `,
    [notificationId, userId]
  );
  return result;
}

export async function markAllNotificationsReadForUser(userId) {
  await pool.query(
    `
      UPDATE notifications
      SET is_read = 1, read_at = NOW()
      WHERE user_id = ?
        AND is_read = 0
      `,
    [userId]
  );
}
