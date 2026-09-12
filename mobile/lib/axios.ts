
import  axios  from "axios";
import {useAuth} from "@clerk/expo";
import { useEffect, useState } from "react";
import * as Sentry from '@sentry/react-native';


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

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if(error.response){
             Sentry.logger.error(Sentry.logger.fmt`API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,{
                status: error.response.status,
                endpoint: error.config?.url,
                method: error.config?.method,
             }
            )
        }else if(error.request){
            Sentry.logger.warn("API Request failed : No response received",{
                endpoint: error.config?.url,
                method: error.config?.method,
            })
        }

        return Promise.reject(error);
      }
    );

    // Cleanup function to remove the interceptor when the component unmounts
   return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    }
  }, [getToken]);

  return api;
};
