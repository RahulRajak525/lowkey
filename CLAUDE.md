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
src/models/              User{clerkId,name,email,avatar} · Chat{participants[],lastMessage,lastMessageAt,deletedFor[]} · Message{chat,sender,text,isDeleted,deletedAt,deletedFor[]}
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
| GET | /chats/with/:participantId | getOrCreateChat | formatChat (self-chat allowed; un-deletes for me if I'd deleted it) |
| DELETE | /chats/:chatId | deleteChat | "delete for me" — $addToSet my id into deletedFor; hard-deletes chat+messages once every participant is in it |
| GET | /messages/chat/:chatId | getMessages | Message[] oldest first, sender populated, excludes ones I deleted "for me" |
| GET | /users | getUsers | all users except me |

`formatChat` → `{_id, participant (other user, or self if isSelf, or null), isSelf, lastMessage, lastMessageAt, createdAt}`.
Chat delete is "for me" only (per-user `deletedFor`, cleared automatically whenever a new message lands in that chat — see send-message below); it's REST, not a socket event, since the other participant is never notified.

**Socket** (`src/utils/socket.ts`). Rooms: `user:<id>` (joined on connect), `chat:<id>`
- client → server: `join-chat` / `leave-chat` (chatId) · `send-message` {chatId,text} (also clears `chat.deletedFor`) · `typing` {chatId,isTyping} · `delete-message` {chatId,messageId,forEveryone}
- server → client: `online-users` {userIds} · `user-online` / `user-offline` {userId} · `new-message` (msg) · `user-typing` {chatId,userId,isTyping} · `message-deleted` {chatId,messageId,forEveryone,message?} · `socket-error` {message}

Message delete: `forEveryone:true` (sender only) sets `isDeleted` and broadcasts to the chat room + both participants' rooms — Message's `toJSON` swaps `text` for a placeholder whenever `isDeleted`, so the row survives and both sides see "This message was deleted". `forEveryone:false` ("for me") just `$addToSet`s my id into that message's `deletedFor` and echoes only to `user:<my id>` (other devices, not the other participant).

## mobile/ ↔ web/ (mirrored)
The same hooks and libs exist in both, so a feature change usually touches both. Both use the `@/` alias.

| Concern | mobile/ (.ts/.tsx) | web/src/ (.js/.jsx) |
|---|---|---|
| Providers / entry | app/_layout.tsx (Clerk, Query, Sentry, theme, Stack) | main.jsx (Clerk, Query, Router) · App.jsx (routes) |
| API client | lib/axios.ts — `API_URL` **hardcoded to Render prod** | lib/axios.js — `VITE_API_URL` or localhost:3000 |
| Socket + presence store | lib/socket.ts | lib/socket.js |
| Data hooks | hooks/useAuth · useChats (+useDeleteChat) · useMessages (+useDeleteMessage) · useUsers | hooks/ (same) |
| Background sync | components/AuthSync · SocketSync | components/AuthSync · SocketSync |
| Loading UI | components/TypingBubble · ChatListSkeleton · MessageThreadSkeleton | components/common/TypingBubble · chat/*Skeleton |
| Theme | global.css (`:root` + `.dark:root`) + tailwind.config.js · lib/theme.ts | index.css `@theme` (dark only) |

Query keys: `["me"]` · `["chats"]` · `["users"]` · `["messages", chatId]`

**mobile screens** (expo-router, `mobile/app/`)
```
index.tsx               redirect to (auth) or (tabs)
(auth)/index.tsx        Google/Apple sign-in → hooks/useSocialAuth + lib/ssoFlow.ts
(auth)/sso-callback.tsx OAuth return
(tabs)/index.tsx        chat list (components/ChatItem, long-press → delete via Alert; EmptyUI)
(tabs)/profile.tsx      avatar upload (ImagePicker → Clerk setProfileImage, base64), theme toggle, sign out
chat/[id].tsx           thread + composer (components/MessageBubble, long-press → delete)
new-chat/index.tsx      modal: pick user (components/UserItem) → getOrCreateChat
```
Also: lib/authErrors.ts, types/index.ts. `mobile/CLAUDE.md` says to read the Expo v57 docs before writing Expo code.

**web** (`web/src/`)
```
pages/SignInPage.jsx    route "/*" (Clerk path routing needs the wildcard for /sso-callback)
pages/ChatsLayout.jsx   "/chats", "/chats/:chatId" → Sidebar + MessageThread + NewChatModal
components/chat/        Sidebar (hover trash icon on ChatListItem → delete, window.confirm), MessageThread, Composer, MessageBubble (hover "⋯" menu → delete), NewChatModal, UserRow
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
