import axios from "axios";

const API = axios.create({
  baseURL: "https://support-crm-production-c936.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;