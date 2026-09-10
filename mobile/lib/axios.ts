
import  axios  from "axios";
import {useAuth} from "@clerk/expo";
import { useEffect, useState } from "react";



// the API service, not the static web site (whisper-app-qc0m) — that one
// answers POSTs with an empty 200 via its SPA rewrite
const API_URL = "https://whisper-web-tjgh.onrender.com";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
//   withCredentials: true,
});


export const useApi = () => {
  const { getToken } = useAuth();
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        const token = await getToken(); 
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      }
    );
    // Cleanup function to remove the interceptor when the component unmounts
   return () => {
      api.interceptors.request.eject(requestInterceptor);
    }
  }, [getToken]);

  return api;
};
