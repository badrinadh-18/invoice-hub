export const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });

      if (validated.body) req.body = validated.body;
      if (validated.query) req.query = validated.query;
      if (validated.params) req.params = validated.params;

      next();
    } catch (err) {
      if (err.errors) {
        const errorMessages = err.errors.map((e) => ({
          path: e.path.join('.').replace(/^(body|query|params)\./, ''),
          message: e.message
        }));

        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: errorMessages[0]?.message || 'Invalid input data.',
            details: errorMessages
          }
        });
      }

      next(err);
    }
  };
};
