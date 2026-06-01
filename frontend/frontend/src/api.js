import axios from "axios";

const API = axios.create({
  baseURL:"https://support-crm-production-450f.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;