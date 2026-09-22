import { useApi } from '@/lib/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth as useClerkAuth } from '@clerk/react'

export const useAuthCallback = () => {
  const { apiWithAuth } = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiWithAuth({ method: 'POST', url: '/auth/callback' })
      return data
    },
    // This response *is* the backend user, so it seeds `useMe` rather than
    // leaving it to a separate round trip. On a first sign-in that round trip
    // would 404 — the row does not exist until this call creates it.
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user)
    },
  })
}

/**
 * The signed-in user as this backend knows them. Needed by the message list:
 * messages carry the Mongo user id, which the Clerk session does not expose.
 */
export const useMe = () => {
  const { apiWithAuth } = useApi()
  const { isSignedIn } = useClerkAuth()

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await apiWithAuth({ method: 'GET', url: '/auth/me' })
      return data
    },
    enabled: Boolean(isSignedIn),
    staleTime: Infinity,
  })
}
