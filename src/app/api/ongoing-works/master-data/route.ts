import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface MasterConfigItem {
  id: string;
  category: "division" | "scheme" | "work_stage";
  value: string;
  created_at?: string;
}

export interface OngoingWorksMasterData {
  rawItems: MasterConfigItem[];
  divisions: string[];
  schemes: string[];
  workStages: string[];
}

const DEFAULT_DIVISIONS = [
  "Chennai",
  "Salem",
  "Madurai",
  "Coimbatore",
  "Tirunelveli",
  "Villupuram",
  "Tiruchirappalli",
  "Dharapuram",
  "Thanjavur",
];

const DEFAULT_SCHEMES = [
  "NH(O)",
  "CRIF",
  "Annual Plan",
  "Special Repairs",
  "State Fund",
  "EPC Work",
  "HAM Project",
];

const DEFAULT_WORK_STAGES = [
  "IN_PROGRESS",
  "TENDER_STAGE",
  "COMPLETED",
  "DELAYED",
  "SANCTIONED",
  "PRE_CONSTRUCTION",
];

function groupMasterData(items: MasterConfigItem[]): OngoingWorksMasterData {
  const dbDivisions = Array.from(new Set(items.filter((i) => i.category === "division").map((i) => i.value)));
  const dbSchemes = Array.from(new Set(items.filter((i) => i.category === "scheme").map((i) => i.value)));
  const dbStages = Array.from(new Set(items.filter((i) => i.category === "work_stage").map((i) => i.value)));

  const divisions = Array.from(new Set([...(dbDivisions.length > 0 ? dbDivisions : DEFAULT_DIVISIONS)])).sort();
  const schemes = Array.from(new Set([...(dbSchemes.length > 0 ? dbSchemes : DEFAULT_SCHEMES)])).sort();
  const workStages = Array.from(new Set([...(dbStages.length > 0 ? dbStages : DEFAULT_WORK_STAGES)])).sort();

  return {
    rawItems: items,
    divisions,
    schemes,
    workStages,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(groupMasterData([]));
    }

    const { data, error } = await supabase
      .from("ongoing_works_master_config")
      .select("*")
      .order("category", { ascending: true })
      .order("value", { ascending: true });

    if (error) {
      console.warn("Notice: ongoing_works_master_config DB read, using fallbacks:", error.message);
      return NextResponse.json(groupMasterData([]));
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/ongoing-works/master-data error:", msg);
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
    if (!["division", "scheme", "work_stage"].includes(cleanCategory)) {
      return NextResponse.json({ error: "Category must be 'division', 'scheme', or 'work_stage'" }, { status: 400 });
    }

    const cleanValue = value.trim();

    // Check duplicate
    const { data: existing } = await supabase
      .from("ongoing_works_master_config")
      .select("id")
      .eq("category", cleanCategory)
      .ilike("value", cleanValue)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Option "${cleanValue}" already exists in ${cleanCategory}` }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("ongoing_works_master_config")
      .insert([{ category: cleanCategory, value: cleanValue }])
      .select()
      .single();

    if (error) {
      console.error("Error creating master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/ongoing-works/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { id, value } = await request.json();

    if (!id || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "ID and updated value are required" }, { status: 400 });
    }

    const cleanValue = value.trim();

    const { data, error } = await supabase
      .from("ongoing_works_master_config")
      .update({ value: cleanValue })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("PUT /api/ongoing-works/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
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

    if (!id) {
      return NextResponse.json({ error: "ID query parameter is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("ongoing_works_master_config")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/ongoing-works/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
