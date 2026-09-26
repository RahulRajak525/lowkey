# Whisper — project map

Real-time 1:1 chat app. Use this map to go straight to the files a task touches
instead of scanning the repo. **Update this file when adding, moving or deleting files.**

## Stack
| Part | Tech | Run |
|---|---|---|
| `backend/` | Bun + Express 5 + Mongoose 9 + Socket.IO 4 (TS) | `bun run dev` → :3000 |
| `mobile/` | Expo 57 (expo-router), RN 0.86, NativeWind 4, Sentry (TS) | `bun run android` (dev client) |
| `web/` | Vite 8 + React 19 + React Router 7, Tailwind 4, framer-motion (JS) | `bun run dev` → :5173 |

All three: Clerk auth · TanStack Query · socket.io. Deploy: `render.yaml` → `whisper-api`
(backend, live at whisper-web-tjgh.onrender.com) + `whisper-app` (web, static).

## How it fits
```
Clerk sign-in ──token──► mobile / web
                           ├─ REST  axios + Bearer  → /api/*  (reads + auth sync)
                           └─ Socket auth.token     → send + live events
backend: clerkMiddleware → protectRoute (Clerk id → Mongo User, sets req.userId) → controller → MongoDB
```
- On sign-in, `AuthSync` POSTs `/auth/callback` → upserts User from Clerk (name, email, avatar).
- Messages are **sent only over the socket** (`send-message`). REST only reads history; there's no POST route.
- `SocketSync` handles `new-message` by patching the query cache (`["messages", id]`, `["chats"]`).

## backend/
```
index.ts                 http server + initializeSocket + connectDB
preload.ts               Bun/bson v8 shim (bunfig preload) — don't remove
src/app.ts               CORS list, json, clerkMiddleware, /health, routes, errorHandler, optional web/dist
src/config/database.ts   mongoose.connect(MONGODB_URI)
src/middleware/auth.ts   protectRoute = [requireAuth(), lookup User → req.userId]
src/middleware/errorHandler.ts
src/models/              User{clerkId,name,email,avatar} · Chat{participants[],lastMessage,lastMessageAt} · Message{chat,sender,text,isDeleted,deletedAt,deletedFor[]}
src/controllers/         auth · chat · message · user
src/routes/              authRoutes · chatRoute · messageRoutes · userRoute
src/utils/socket.ts      ALL socket events + in-memory onlineUsers map
src/scripts/             seed.ts, dropStaleUserIndexes.ts
```

**REST** (mounted under `/api`)
| Method | Path | Controller | Returns |
|---|---|---|---|
| POST | /auth/callback | authCallback (getAuth, not protectRoute) | upserted User |
| GET | /auth/me | getMe | User |
| GET | /chats | getChats | formatChat[] sorted by lastMessageAt desc |
| GET | /chats/with/:participantId | getOrCreateChat | formatChat (self-chat allowed) |
| DELETE | /chats/:chatId | deleteChat | clears (Message.deletedFor $addToSet) every message in the chat, for me only |
| GET | /messages/chat/:chatId | getMessages | Message[] oldest first, sender populated, excludes ones I deleted "for me" |
| GET | /users/search?email= | searchUserByEmail | one User (or null) by exact email, excluding self |

`formatChat` → `{_id, participant (other user, or self if isSelf, or null), isSelf, lastMessage, lastMessageAt, createdAt}`; `lastMessage` comes back `null` if that particular message is hidden for the requesting user (see below).

**Chats are never hidden or removed for one side** — there is no chat-level "deleted" state, so `getChats` always lists every chat you're a participant in and a chat row never disappears. "Delete Chat" (from Chat Details, or the chat-list long-press/hover) instead bulk-applies the same per-message `deletedFor` a single message delete uses, to every message in that chat — it's REST, not a socket event, since the other participant is never notified or affected. Because old messages stay marked hidden-for-me (not un-hidden), a message the other side sends afterwards shows up on its own without dragging the cleared history back into view. `formatChat` nulls out `lastMessage` when that specific message is hidden for the requesting user, so the list preview correctly falls back to "No messages yet" for them without affecting the other participant's view.

**There is deliberately no "list all users" endpoint** — a privacy fix: a new sign-up used to see every other user in `useUsers()`'s directory. Finding someone to chat with now requires typing their exact email into New Chat, which calls `/users/search`; nothing renders until the query looks like a complete address (`isLikelyEmail` in both clients' `hooks/useUsers`).

**Socket** (`src/utils/socket.ts`). Rooms: `user:<id>` (joined on connect), `chat:<id>`
- client → server: `join-chat` / `leave-chat` (chatId) · `send-message` {chatId,text} · `typing` {chatId,isTyping} · `delete-message` {chatId,messageId,forEveryone}
- server → client: `online-users` {userIds} · `user-online` / `user-offline` {userId} · `new-message` (msg) · `user-typing` {chatId,userId,isTyping} · `message-deleted` {chatId,messageId,forEveryone,message?} · `socket-error` {message}

Message delete: `forEveryone:true` (sender only) sets `isDeleted` and broadcasts to the chat room + both participants' rooms — Message's `toJSON` swaps `text` for a placeholder whenever `isDeleted`, so the row survives and both sides see "This message was deleted". `forEveryone:false` ("for me") just `$addToSet`s my id into that message's `deletedFor` and echoes only to `user:<my id>` (other devices, not the other participant).

## mobile/ ↔ web/ (mirrored)
The same hooks and libs exist in both, so a feature change usually touches both. Both use the `@/` alias.

| Concern | mobile/ (.ts/.tsx) | web/src/ (.js/.jsx) |
|---|---|---|
| Providers / entry | app/_layout.tsx (Clerk, Query, Sentry, theme, Stack) | main.jsx (Clerk, Query, Router) · App.jsx (routes) |
| API client | lib/axios.ts — `API_URL` **hardcoded to Render prod** | lib/axios.js — `VITE_API_URL` or localhost:3000 |
| Socket + presence store | lib/socket.ts | lib/socket.js |
| Data hooks | hooks/useAuth · useChats (+useDeleteChat) · useMessages (+useDeleteMessage) · useUsers (useSearchUserByEmail, isLikelyEmail) | hooks/ (same) |
| Background sync | components/AuthSync · SocketSync | components/AuthSync · SocketSync |
| Loading UI | components/TypingBubble · ChatListSkeleton · MessageThreadSkeleton | components/common/TypingBubble · chat/*Skeleton |
| Theme | global.css (`:root` + `.dark:root`) + tailwind.config.js · lib/theme.ts | index.css `@theme` (dark only) |

Query keys: `["me"]` · `["chats"]` · `["users", "search", email]` · `["messages", chatId]`

**mobile screens** (expo-router, `mobile/app/`)
```
index.tsx               redirect to (auth) or (tabs)
(auth)/index.tsx        Google/Apple sign-in → hooks/useSocialAuth + lib/ssoFlow.ts
(auth)/sso-callback.tsx OAuth return
(tabs)/index.tsx        chat list (components/ChatItem, long-press → clear chat via Alert; EmptyUI)
(tabs)/profile.tsx      avatar upload (ImagePicker → Clerk setProfileImage, base64), theme toggle, sign out
chat/[id].tsx           thread + composer (components/MessageBubble, long-press → delete message); header is tappable → /chat-details
chat-details.tsx        one conversation's info + "Delete Chat" (clears its messages for me; reached from chat/[id]'s header)
new-chat/index.tsx      search a user by exact email (components/UserItem) → getOrCreateChat
```
Also: lib/authErrors.ts, types/index.ts. `mobile/CLAUDE.md` says to read the Expo v57 docs before writing Expo code.

**web** (`web/src/`)
```
pages/SignInPage.jsx    route "/*" (Clerk path routing needs the wildcard for /sso-callback)
pages/ChatsLayout.jsx   "/chats", "/chats/:chatId" → Sidebar + MessageThread + NewChatModal
components/chat/        Sidebar (hover trash icon on ChatListItem → clear chat, window.confirm), MessageThread (header is clickable → ChatDetailsModal), Composer, MessageBubble (hover "⋯" menu → delete message), NewChatModal, ChatDetailsModal (one conversation's info + "Delete Chat", clears its messages for me), UserRow
components/common/      Avatar, EmptyState, SplashScreen, AuroraBackground, TypingBubble
lib/types.js            senderOf, hasParticipant
```

## Env vars
- backend: `MONGODB_URI` `CLERK_PUBLISHABLE_KEY` `CLERK_SECRET_KEY` `FRONTEND_URL` `PORT`
- web: `VITE_CLERK_PUBLISHABLE_KEY` `VITE_API_URL`
- mobile: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`

## Common changes → files
- New REST endpoint: controller + route (+ mount in app.ts), then a hook in mobile/hooks and web/src/hooks
- New socket event: backend utils/socket.ts, then lib/socket and SocketSync on both clients
- New model field: model, then controller populate/select (formatChat for chats), then UI on both clients
- New allowed origin: backend app.ts **and** utils/socket.ts (two separate CORS lists)
- Colors / theme: mobile global.css + tailwind.config.js; web index.css
