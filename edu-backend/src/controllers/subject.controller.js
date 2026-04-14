// src/controllers/subject.controller.js
import pool from "../db.js";

export const getAllSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name_ar, name_en FROM subjects WHERE is_active = 1 ORDER BY sort_order, id"
    );

    return res.json({
      success: true,
      data: rows,
    });
  } catch (err) {
    console.error("getAllSubjects error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load subjects.",
    });
  }
};
