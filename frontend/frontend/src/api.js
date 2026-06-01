import axios from "axios";

const API = axios.create({
  baseURL: "https://support-crm-production-0b0d.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;