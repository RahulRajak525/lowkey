// Bun 1.3.x exposes node:v8's startupSnapshot.isBuildingSnapshot() as a stub that
// throws ERR_NOT_IMPLEMENTED. bson >= 7 calls it at import time (via mongoose), which
// crashes the process on startup. We are never inside a V8 startup snapshot under Bun,
// so answering "false" is correct. Remove once Bun implements it.
const v8 = process.getBuiltinModule("v8")

if (v8?.startupSnapshot) {
    v8.startupSnapshot.isBuildingSnapshot = () => false
}
