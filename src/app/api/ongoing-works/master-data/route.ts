import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/^["']|["']$/g, "").trim();
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).replace(/^["']|["']$/g, "").trim();
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface MasterConfigItem {
  id: string;
  category: "circle" | "division" | "scheme";
  value: string;
  parent_category?: string | null;
  parent_value?: string | null;
  created_at?: string;
}

export interface OngoingWorksMasterData {
  rawItems: MasterConfigItem[];
  circles: string[];
  divisions: string[];
  schemes: string[];
  circleDivisionMap: Record<string, string[]>;
}

function groupMasterData(items: MasterConfigItem[]): OngoingWorksMasterData {
  const circles = Array.from(
    new Set(items.filter((i) => i.category === "circle").map((i) => i.value.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const divisions = Array.from(
    new Set(items.filter((i) => i.category === "division").map((i) => i.value.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const schemes = Array.from(
    new Set(items.filter((i) => i.category === "scheme").map((i) => i.value.trim()))
  ).sort((a, b) => a.localeCompare(b));

  const circleDivisionMap: Record<string, string[]> = {};
  circles.forEach((c) => {
    circleDivisionMap[c] = [];
  });

  items
    .filter((i) => i.category === "division")
    .forEach((item) => {
      const parentCircle = item.parent_value?.trim();
      if (parentCircle) {
        if (!circleDivisionMap[parentCircle]) {
          circleDivisionMap[parentCircle] = [];
        }
        if (!circleDivisionMap[parentCircle].includes(item.value.trim())) {
          circleDivisionMap[parentCircle].push(item.value.trim());
        }
      }
    });

  // Sort division arrays inside each circle
  Object.keys(circleDivisionMap).forEach((circleKey) => {
    circleDivisionMap[circleKey].sort((a, b) => a.localeCompare(b));
  });

  return {
    rawItems: items,
    circles,
    divisions,
    schemes,
    circleDivisionMap,
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
      console.error("GET /api/ongoing-works/master-data DB error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/ongoing-works/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const body = await request.json();
    const { category, value, parent_category, parent_value } = body;

    if (!category || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
    }

    const cleanCategory = category.trim().toLowerCase();
    if (!["circle", "division", "scheme"].includes(cleanCategory)) {
      return NextResponse.json(
        { error: "Category must be 'circle', 'division', or 'scheme'" },
        { status: 400 }
      );
    }

    const cleanValue = value.trim();
    const cleanParentCategory = parent_category
      ? String(parent_category).trim().toLowerCase()
      : cleanCategory === "division"
      ? "circle"
      : null;
    const cleanParentValue = parent_value ? String(parent_value).trim() : null;

    // Check duplicate
    let checkQuery = supabase
      .from("ongoing_works_master_config")
      .select("id")
      .eq("category", cleanCategory)
      .ilike("value", cleanValue);

    if (cleanParentValue) {
      checkQuery = checkQuery.ilike("parent_value", cleanParentValue);
    }

    const { data: existing, error: checkError } = await checkQuery.maybeSingle();
    if (checkError) {
      console.error("Error checking existing option:", checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json(
        {
          error: `Option "${cleanValue}" already exists in ${cleanCategory}${
            cleanParentValue ? ` under ${cleanParentValue}` : ""
          }`,
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("ongoing_works_master_config")
      .insert([
        {
          category: cleanCategory,
          value: cleanValue,
          parent_category: cleanParentCategory,
          parent_value: cleanParentValue,
        },
      ])
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

    const body = await request.json();
    const { id, value, parent_category, parent_value } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};

    if (value && typeof value === "string" && value.trim() !== "") {
      updates.value = value.trim();
    }
    if (parent_category !== undefined) {
      updates.parent_category = parent_category ? String(parent_category).trim().toLowerCase() : null;
    }
    if (parent_value !== undefined) {
      updates.parent_value = parent_value ? String(parent_value).trim() : null;
    }

    const { data, error } = await supabase
      .from("ongoing_works_master_config")
      .update(updates)
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
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        if (body?.id) id = body.id;
      } catch {
        // body was empty or not json
      }
    }

    if (!id) {
      return NextResponse.json({ error: "ID is required to delete option" }, { status: 400 });
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
