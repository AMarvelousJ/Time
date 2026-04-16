const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    result[key] = value;
  }
  return result;
};

const run = async () => {
  const envFile = path.resolve(process.cwd(), ".env.local");
  const envFromFile = loadEnvFile(envFile);
  const supabaseUrl = process.env.SUPABASE_URL || envFromFile.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || envFromFile.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const deleteAll = async (table) => {
    const { error } = await supabase.from(table).delete().not("id", "is", null);
    if (error) throw new Error(`${table}: ${error.message}`);
    console.log(`cleared ${table}`);
  };

  await deleteAll("timeline_change_logs");
  await deleteAll("timeline_snapshots");
  await deleteAll("students");
  await deleteAll("registration_requests");
  await deleteAll("role_assignments");
  await deleteAll("profiles");
  await deleteAll("party_branches");
  await deleteAll("colleges");

  console.log("mock/test data cleared");
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

