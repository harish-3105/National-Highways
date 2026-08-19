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
  category: "division" | "scheme";
  value: string;
  created_at?: string;
}

export interface OngoingWorksMasterData {
  rawItems: MasterConfigItem[];
  divisions: string[];
  schemes: string[];
}

function groupMasterData(items: MasterConfigItem[]): OngoingWorksMasterData {
  const divisions = Array.from(new Set(items.filter((i) => i.category === "division").map((i) => i.value))).sort();
  const schemes = Array.from(new Set(items.filter((i) => i.category === "scheme").map((i) => i.value))).sort();

  return {
    rawItems: items,
    divisions,
    schemes,
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
      console.error("Error fetching ongoing_works_master_config:", error);
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
    if (cleanCategory !== "division" && cleanCategory !== "scheme") {
      return NextResponse.json({ error: "Category must be 'division' or 'scheme'" }, { status: 400 });
    }

    const cleanValue = value.trim();

    const { data, error } = await supabase
      .from("ongoing_works_master_config")
      .insert([{ category: cleanCategory, value: cleanValue }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: `"${cleanValue}" already exists in ${cleanCategory} options.` }, { status: 400 });
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
      const { data: existing } = await supabase
        .from("ongoing_works_master_config")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("ongoing_works_master_config")
        .update({ value: cleanNewValue })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json({ error: `An option named "${cleanNewValue}" already exists.` }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Sync existing ongoing work records if category matches division or scheme
      if (existing && existing.category && existing.value) {
        const catColumn = existing.category === "division" ? "division" : "scheme";
        try {
          await supabase
            .from("major_projects_50cr")
            .update({ [catColumn]: cleanNewValue })
            .eq(catColumn, existing.value);
        } catch (syncErr) {
          console.warn("Syncing project records warning:", syncErr);
        }
      }

      return NextResponse.json(data);
    } else if (category && oldValue) {
      const cleanCategory = category.trim().toLowerCase();
      const cleanOldValue = oldValue.trim();

      const { data, error } = await supabase
        .from("ongoing_works_master_config")
        .update({ value: cleanNewValue })
        .eq("category", cleanCategory)
        .eq("value", cleanOldValue)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Sync ongoing work records
      const catColumn = cleanCategory === "division" ? "division" : "scheme";
      try {
        await supabase
          .from("major_projects_50cr")
          .update({ [catColumn]: cleanNewValue })
          .eq(catColumn, cleanOldValue);
      } catch (syncErr) {
        console.warn("Syncing project records warning:", syncErr);
      }

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
      const { error } = await supabase.from("ongoing_works_master_config").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (category && value) {
      const { error } = await supabase
        .from("ongoing_works_master_config")
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
