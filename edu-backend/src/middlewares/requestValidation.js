function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function formatErrors(errors) {
  return errors
    .filter(Boolean)
    .map((entry) => (typeof entry === "string" ? { field: "body", message: entry } : entry));
}

export function validateRequest(validator) {
  return (req, res, next) => {
    const result = validator({
      body: asObject(req.body),
      params: asObject(req.params),
      query: asObject(req.query),
    });

    const errors = formatErrors(Array.isArray(result?.errors) ? result.errors : []);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        errors,
      });
    }

    return next();
  };
}
