// One-off migration: UserSchema used to declare `name` as unique, so Mongo
// built a `name_1` unique index. Removing `unique` from the schema does not
// drop an index that already exists, so it lingers and rejects any two users
// who share a display name. Mongoose only ever adds indexes, never removes.
//
// Run once against each environment:  bun src/scripts/dropStaleUserIndexes.ts
import mongoose from "mongoose";
import { connectDB } from "../config/database";

const STALE_INDEXES = ["name_1"];

async function main() {
  await connectDB();

  const users = mongoose.connection.collection("users");
  const existing = await users.indexes();
  console.log("Current indexes:", existing.map((i) => i.name).join(", "));

  for (const name of STALE_INDEXES) {
    if (!existing.some((i) => i.name === name)) {
      console.log(`⏭️  ${name} not present, nothing to do`);
      continue;
    }
    await users.dropIndex(name);
    console.log(`✅ dropped ${name}`);
  }

  const remaining = await users.indexes();
  console.log("Remaining indexes:", remaining.map((i) => i.name).join(", "));

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("❎ migration failed:", error);
  await mongoose.disconnect();
  process.exit(1);
});
