import { useApi } from '@/lib/axios'
import { messagesQueryKey } from '@/hooks/useMessages'
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
 * Clears every message in the chat "for me" only — the row stays in the
 * list (and on the other participant's side) exactly as it was; only this
 * device's view of the conversation empties out. A message they send
 * afterwards shows up on its own, since the cleared history stays hidden
 * rather than being restored.
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
      queryClient.setQueryData(messagesQueryKey(chatId), [])
      queryClient.setQueryData(['chats'], (previous) =>
        previous?.map((chat) => (chat._id === chatId ? { ...chat, lastMessage: null } : chat)),
      )
    },
  })
}
