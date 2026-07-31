// lib/api-client.ts
import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

let initLogged = false;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

if (!initLogged) {
  console.log(`🔧 API Client initialized with baseURL: ${BASE_URL}`);
  initLogged = true;
}

export default apiClient;
