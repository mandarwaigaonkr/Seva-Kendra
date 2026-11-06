const errorHandler = (err, req, res, next) => {
  const normalizedStatusCode =
    Number.isInteger(err.statusCode) && err.statusCode >= 100 && err.statusCode <= 599
      ? err.statusCode
      : 500;

  const customError = {
    statusCode: normalizedStatusCode,
    msg: err.message ?? "Something went wrong try again later",
    success: false,
  };

  if (err.name === "ValidationError") {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(",");
    customError.statusCode = 400;
  }

  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = 400;
  }

  if (err.name === "CastError") {
    if (err.path === "_id") {
      customError.msg = `No item found with id : ${err.value}`;
      customError.statusCode = 404;
    } else {
      customError.msg = `Invalid value "${err.value}" for ${err.path}`;
      customError.statusCode = 400;
    }
  }
  // Unexpected errors are logged in full but answered generically, so database and code
  // details never reach the client.
  if (customError.statusCode >= 500) {
    console.error(err);
    customError.msg = "Something went wrong. Please try again.";
  }

  return res.status(customError.statusCode ?? 400).json({
    message: customError.msg,
    status: "failure",
    success: customError.success,
  });
};

export default errorHandler;
