let rawUrl = process.env.REACT_APP_BASE_URL || "http://localhost:5001/";
if (rawUrl.endsWith("api/") || rawUrl.endsWith("api")) {
  rawUrl = rawUrl.replace(/api\/?$/, "");
}
if (!rawUrl.endsWith("/")) {
  rawUrl += "/";
}

export const constant = {
  baseUrl: rawUrl,
};
