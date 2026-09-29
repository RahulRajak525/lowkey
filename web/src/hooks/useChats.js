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
 * "Clear Chat" (Chat Details) — every message is hidden for me only; the row
 * stays in the list (and on the other participant's side). A message they send
 * afterwards shows up on its own, since the cleared history stays hidden.
 */
export const useClearChat = () => {
  const { apiWithAuth } = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (chatId) => {
      await apiWithAuth({ method: 'DELETE', url: `/chats/${chatId}/messages` })
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

/**
 * "Delete Chat" (chat-list hover) — clears the messages like useClearChat
 * *and* removes the row from my list. It comes back (with only the new
 * message) as soon as either side sends something.
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
        previous?.filter((chat) => chat._id !== chatId),
      )
    },
  })
}
