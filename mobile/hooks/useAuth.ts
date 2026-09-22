import { useApi } from "@/lib/axios";
import { User } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/expo";

export const useAuthCallback = () => {
  const { apiWithAuth } = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth<User>({ method: "POST", url: "/auth/callback" });
      return data;
    },
    // This response *is* the backend user, so it seeds `useMe` rather than
    // leaving it to a separate round trip. On a first sign-in that round trip
    // would 404 — the row does not exist until this call creates it — and
    // SocketSync waits on `me` before opening the socket.
    onSuccess: (user) => {
      queryClient.setQueryData<User>(["me"], user);
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
