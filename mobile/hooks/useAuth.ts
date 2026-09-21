import { useApi } from "@/lib/axios";
import { User } from "@/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";

export const useAuthCallback = () => {
  const { apiWithAuth } = useApi();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<User>({ method: "POST", url: "/auth/callback" });
      return data;
    },
  });
};

/**
 * The signed-in user as this backend knows them. Needed by the message list:
 * messages carry the Mongo user id, which the Clerk session does not expose.
 */
export const useMe = () => {
  const { apiWithAuth } = useApi();
  const { isSignedIn } = useAuth();

  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await apiWithAuth<User>({ method: "GET", url: "/auth/me" });
      return data;
    },
    enabled: Boolean(isSignedIn),
    staleTime: Infinity,
  });
};
