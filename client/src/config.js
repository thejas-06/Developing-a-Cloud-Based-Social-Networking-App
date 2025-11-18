let BASE_URL = "/";
if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
  BASE_URL = "http://localhost:4001/";
}

export { BASE_URL };
