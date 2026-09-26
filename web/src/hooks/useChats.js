import { useApi } from '@/lib/axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const useChats = () => {
  const { apiWithAuth } = useApi()
  return useQuery({
    queryKey: ['chats'],
    queryFn: async () => {
      const { data } = await apiWithAuth({ method: 'GET', url: '/chats' })
      return data
    },
  })
}

export const useGetOrCreateChat = () => {
  const { apiWithAuth } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (participantId) => {
      const { data } = await apiWithAuth({
        method: 'GET',
        url: `/chats/with/${participantId}`,
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chats'] })
    },
  })
}

/**
 * "Delete for me" only — the row disappears from this user's list, but
 * reappears (server side) the moment the other person sends a new message.
 */
export const useDeleteChat = () => {
  const { apiWithAuth } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (chatId) => {
      await apiWithAuth({ method: 'DELETE', url: `/chats/${chatId}` })
      return chatId
    },
    onSuccess: (chatId) => {
      queryClient.setQueryData(['chats'], (previous) =>
        previous?.filter((chat) => chat._id !== chatId),
      )
    },
  })
}
