import { supabase } from "@/lib/supabase";
import HeaderClient from "./HeaderClient";

async function getSettings() {
  const { data } = await supabase
    .from("settings")
    .select("*")
    .limit(1);

  return data?.[0] || null;
}

export default async function Header() {
  const settings =
    await getSettings();

  return (
    <HeaderClient
      logo={settings?.logo || ""}
      siteName={
        settings?.site_name ||
        "Baby Nest"
      }
    />
  );
}