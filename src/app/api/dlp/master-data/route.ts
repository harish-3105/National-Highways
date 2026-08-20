import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface DlpMasterConfigItem {
  id: string;
  category: "circle" | "division" | "contract_mode" | "maintenance_type" | "status";
  value: string;
  created_at?: string;
}

export interface DlpMasterData {
  rawItems: DlpMasterConfigItem[];
  circles: string[];
  divisions: string[];
  contractModes: string[];
  maintenanceTypes: string[];
  statuses: string[];
}

const DEFAULT_CIRCLES = ["Chennai", "Salem", "Madurai", "Coimbatore", "Tirunelveli", "Villupuram"];
const DEFAULT_DIVISIONS = [
  "Salem",
  "Madurai",
  "Chennai",
  "Dharapuram",
  "Tirunelveli",
  "Villupuram",
  "Thanjavur",
  "Chengalpattu",
  "Tiruvallur",
  "Namakkal",
  "Dharmapuri",
  "Dindigul",
  "Theni",
];
const DEFAULT_CONTRACT_MODES = [
  "EPC",
  "STMC",
  "PBMC",
  "BOT",
  "HAM",
  "Annual Plan",
  "Special Repairs",
  "Departmental",
];
const DEFAULT_MAINTENANCE_TYPES = [
  "DLP",
  "STMC",
  "PBMC",
  "CONSTRUCTION",
  "NO_DLP",
  "UNCONTRACTED",
];
const DEFAULT_STATUSES = ["ACTIVE", "EXPIRING_SOON", "EXPIRED"];

function groupMasterData(items: DlpMasterConfigItem[]): DlpMasterData {
  const circlesFromDb = items.filter((i) => i.category === "circle").map((i) => i.value);
  const divisionsFromDb = items.filter((i) => i.category === "division").map((i) => i.value);
  const modesFromDb = items.filter((i) => i.category === "contract_mode").map((i) => i.value);
  const typesFromDb = items.filter((i) => i.category === "maintenance_type").map((i) => i.value);
  const statusesFromDb = items.filter((i) => i.category === "status").map((i) => i.value);

  const circles = Array.from(new Set([...DEFAULT_CIRCLES, ...circlesFromDb])).sort();
  const divisions = Array.from(new Set([...DEFAULT_DIVISIONS, ...divisionsFromDb])).sort();
  const contractModes = Array.from(new Set([...DEFAULT_CONTRACT_MODES, ...modesFromDb])).sort();
  const maintenanceTypes = Array.from(new Set([...DEFAULT_MAINTENANCE_TYPES, ...typesFromDb])).sort();
  const statuses = Array.from(new Set([...DEFAULT_STATUSES, ...statusesFromDb])).sort();

  return {
    rawItems: items,
    circles,
    divisions,
    contractModes,
    maintenanceTypes,
    statuses,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(groupMasterData([]));
    }

    const { data, error } = await supabase
      .from("dlp_master_config")
      .select("*")
      .order("category", { ascending: true })
      .order("value", { ascending: true });

    if (error) {
      console.warn("dlp_master_config table query note:", error.message);
      return NextResponse.json(groupMasterData([]));
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/dlp/master-data error:", msg);
    return NextResponse.json(groupMasterData([]));
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { category, value } = await request.json();

    if (!category || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
    }

    const cleanCategory = category.trim().toLowerCase();
    const allowed = ["circle", "division", "contract_mode", "maintenance_type", "status"];
    if (!allowed.includes(cleanCategory)) {
      return NextResponse.json(
        { error: `Category must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const cleanValue = value.trim();

    const { data, error } = await supabase
      .from("dlp_master_config")
      .insert([{ category: cleanCategory, value: cleanValue }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `"${cleanValue}" already exists in ${cleanCategory} options.` },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Failed to add master data option" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { id, category, oldValue, newValue } = await request.json();

    if (!newValue || typeof newValue !== "string" || newValue.trim() === "") {
      return NextResponse.json({ error: "New option value is required" }, { status: 400 });
    }

    const cleanNewValue = newValue.trim();

    if (id) {
      const { data, error } = await supabase
        .from("dlp_master_config")
        .update({ value: cleanNewValue })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json(
            { error: `An option named "${cleanNewValue}" already exists.` },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } else if (category && oldValue) {
      const cleanCategory = category.trim().toLowerCase();
      const cleanOldValue = oldValue.trim();

      const { data, error } = await supabase
        .from("dlp_master_config")
        .update({ value: cleanNewValue })
        .eq("category", cleanCategory)
        .eq("value", cleanOldValue)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: "Missing id or category/oldValue parameters" }, { status: 400 });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Failed to update master data option" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const value = searchParams.get("value");

    if (id) {
      const { error } = await supabase.from("dlp_master_config").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (category && value) {
      const { error } = await supabase
        .from("dlp_master_config")
        .delete()
        .eq("category", category)
        .eq("value", value);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "Missing id or category/value parameters" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Option deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Failed to delete option" }, { status: 500 });
  }
}
