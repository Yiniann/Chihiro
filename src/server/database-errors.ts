export function isDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = Reflect.get(error, "code");
  if (typeof code === "string") {
    const normalizedCode = code.toUpperCase();

    if (
      normalizedCode === "ECONNREFUSED" ||
      normalizedCode === "ECONNRESET" ||
      normalizedCode === "ENOTFOUND" ||
      normalizedCode === "EHOSTUNREACH" ||
      normalizedCode === "ETIMEDOUT" ||
      normalizedCode === "57P01"
    ) {
      return true;
    }
  }

  const message = Reflect.get(error, "message");
  if (typeof message === "string") {
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("database_url is not set") ||
      normalizedMessage.includes("can't reach database server") ||
      normalizedMessage.includes("failed to connect") ||
      normalizedMessage.includes("connection") ||
      normalizedMessage.includes("timeout")
    ) {
      return true;
    }
  }

  const cause = Reflect.get(error, "cause");
  return cause !== error && isDatabaseUnavailableError(cause);
}

export function isDatabaseSchemaMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = Reflect.get(error, "code");
  if (typeof code === "string") {
    const normalizedCode = code.toUpperCase();

    if (normalizedCode === "P2021" || normalizedCode === "42P01") {
      return true;
    }
  }

  const message = Reflect.get(error, "message");
  if (typeof message === "string") {
    const normalizedMessage = message.toLowerCase();

    if (
      normalizedMessage.includes("table does not exist") ||
      normalizedMessage.includes("relation") && normalizedMessage.includes("does not exist") ||
      normalizedMessage.includes("the table") && normalizedMessage.includes("does not exist")
    ) {
      return true;
    }
  }

  const cause = Reflect.get(error, "cause");
  return cause !== error && isDatabaseSchemaMissingError(cause);
}
