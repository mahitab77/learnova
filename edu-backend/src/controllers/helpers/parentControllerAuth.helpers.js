export function requireParentOrAdmin(req, res) {
  const user = req.user;

  if (!user || !user.id) {
    return {
      user: null,
      errorResponse: res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in again.",
      }),
    };
  }

  if (user.role !== "parent" && user.role !== "admin") {
    return {
      user: null,
      errorResponse: res.status(403).json({
        success: false,
        message: "Only parent or admin users are allowed to perform this action.",
      }),
    };
  }

  return { user, errorResponse: null };
}

export function requireParent(req, res) {
  const user = req.user;

  if (!user || !user.id) {
    return {
      user: null,
      errorResponse: res.status(401).json({
        success: false,
        message: "Not authenticated. Please log in again.",
      }),
    };
  }

  if (user.role !== "parent") {
    return {
      user: null,
      errorResponse: res.status(403).json({
        success: false,
        message: "Only parent users are allowed to perform this action.",
      }),
    };
  }

  return { user, errorResponse: null };
}
