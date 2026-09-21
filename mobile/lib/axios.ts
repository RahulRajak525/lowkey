import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosRequestConfig,
  type RawAxiosHeaders,
} from "axios";
import { useAuth } from "@clerk/expo";
import { useCallback } from "react";
import * as Sentry from "@sentry/react-native";

// the API service, not the static web site (whisper-app-qc0m) — that one
// answers POSTs with an empty 200 via its SPA rewrite.
// Every backend route is mounted under /api, so it lives in the baseURL and
// callers pass paths like "/auth/callback".
// exported so the socket client dials the same host (it connects at the
// origin, not under /api).
export const API_URL = "https://whisper-web-tjgh.onrender.com";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  //   withCredentials: true,
});

// `api` is a singleton, so this is registered once at module load rather than
// per mount — inside an effect, every extra useApi() consumer added another
// copy and one failure was reported to Sentry once per mounted consumer.
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // aborted requests (unmount, react-query cancellation) aren't failures
    if (axios.isCancel(error)) return Promise.reject(error);

    const endpoint = error.config?.url;
    const method = error.config?.method;

    if (error.response) {
      Sentry.logger.error(
        Sentry.logger.fmt`API Error: ${method?.toUpperCase()} ${endpoint}`,
        {
          status: error.response.status,
          endpoint,
          method,
        }
      );
    } else if (error.request) {
      Sentry.logger.warn("API Request failed : No response received", {
        endpoint,
        method,
      });
    }

    return Promise.reject(error);
  }
);

// Narrower than AxiosRequestConfig, whose `headers` also allows the
// method-keyed defaults shape that AxiosHeaders cannot be built from.
type RequestConfig = Omit<AxiosRequestConfig, "headers"> & {
  headers?: RawAxiosHeaders;
};

export const useApi = () => {
  const { getToken } = useAuth();

  // The token is attached per call instead of by a request interceptor: an
  // interceptor has to read `getToken` out of module-level mutable state, which
  // is either a write during render (unsafe under the React Compiler this app
  // enables) or a write in an effect (too late for a request fired from a
  // child's mount effect, which then goes out unauthenticated).
  const apiWithAuth = useCallback(
    async <T,>(config: RequestConfig) => {
      const token = await getToken();
      const headers = new AxiosHeaders(config.headers);
      if (token) headers.set("Authorization", `Bearer ${token}`);

      return api<T>({ ...config, headers });
    },
    [getToken]
  );

  return { apiWithAuth };
};
