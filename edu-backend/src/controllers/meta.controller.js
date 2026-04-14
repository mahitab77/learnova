import pool from "../db.js";

/**
 * GET /meta/grade-catalog
 * Returns systems + stages + levels in one call for onboarding/registration UIs.
 */
export const getGradeCatalog = async (req, res) => {
  try {
    // Adjust table/column names if yours differ.
    const [systems] = await pool.query(`
      SELECT id, name, code
      FROM educational_systems
      ORDER BY id ASC
    `);

    const [stages] = await pool.query(`
      SELECT
        id,
        system_id AS systemId,
        name_en  AS nameEn,
        name_ar  AS nameAr,
        code
      FROM grade_stages
      ORDER BY system_id ASC, id ASC
    `);

    const [levels] = await pool.query(`
      SELECT
        id,
        stage_id AS stageId,
        name_en  AS nameEn,
        name_ar  AS nameAr,
        code
      FROM grade_levels
      ORDER BY stage_id ASC, id ASC
    `);

    return res.json({
      success: true,
      data: { systems, stages, levels },
    });
  } catch (err) {
    console.error("getGradeCatalog error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load grade catalog.",
    });
  }
};
