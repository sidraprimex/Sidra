export async function readJsonResponse<T extends object>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const raw = await response.text();
  try {
    const parsed = raw ? JSON.parse(raw) as unknown : {};
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("INVALID_JSON_SHAPE");
    }
    return parsed as T;
  } catch {
    throw new Error(
      response.ok
        ? "Sidra received an invalid server response. Please try again."
        : fallbackMessage,
    );
  }
}
