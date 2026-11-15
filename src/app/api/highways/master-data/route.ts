import { NextRequest, NextResponse } from "next/server";
import { createMockSupabaseClient } from "@/lib/mock/mockSupabase";
import { getSession } from "@/lib/auth/session";
import { canPerformAction } from "@/lib/auth/permissions";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  return createMockSupabaseClient();
}

export interface HighwayMasterConfigItem {
  id: string;
  category: "circle" | "division" | "configuration" | "level2_lane_status";
  value: string;
  parent_category?: string | null;
  parent_value?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HighwayMasterData {
  rawItems: HighwayMasterConfigItem[];
  circles: string[];
  divisions: string[];
  configurations: string[];
  level2LaneStatuses: string[];
  circleDivisionMap: Record<string, string[]>;
}

function groupMasterData(items: HighwayMasterConfigItem[]): HighwayMasterData {
  const activeItems = items.filter((i) => !i.status || i.status === "ACTIVE");
  const circles = Array.from(new Set(activeItems.filter((i) => i.category === "circle").map((i) => i.value.trim()))).sort();
  const divisions = Array.from(new Set(activeItems.filter((i) => i.category === "division").map((i) => i.value.trim()))).sort();
  const configurations = Array.from(new Set(activeItems.filter((i) => i.category === "configuration").map((i) => i.value.trim()))).sort();
  const level2LaneStatuses = Array.from(new Set(activeItems.filter((i) => i.category === "level2_lane_status").map((i) => i.value.trim()))).sort();

  const circleDivisionMap: Record<string, string[]> = {};
  circles.forEach((c) => {
    circleDivisionMap[c] = [];
  });

  activeItems
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

  Object.keys(circleDivisionMap).forEach((circleKey) => {
    circleDivisionMap[circleKey].sort((a, b) => a.localeCompare(b));
  });

  return {
    rawItems: activeItems,
    circles,
    divisions,
    configurations,
    level2LaneStatuses,
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
      .from("highway_master_config")
      .select("*")
      .order("category", { ascending: true })
      .order("value", { ascending: true });

    if (error) {
      console.warn("highway_master_config table query note:", error.message);
      return NextResponse.json(groupMasterData([]));
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/highways/master-data error:", msg);
    return NextResponse.json(groupMasterData([]));
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    let authCheck = canPerformAction(session, "highways:master_data_manage");
    if (!authCheck.allowed) {
      authCheck = canPerformAction(session, "master_data:manage");
    }
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { category, value, parent_category, parent_value } = await request.json();

    if (!category || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
    }

    const cleanCategory = category.trim().toLowerCase();
    const allowed = ["circle", "division", "configuration", "level2_lane_status"];
    if (!allowed.includes(cleanCategory)) {
      return NextResponse.json(
        { error: `Category must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const cleanValue = value.trim();

    const { data, error } = await supabase
      .from("highway_master_config")
      .insert([
        {
          category: cleanCategory,
          value: cleanValue,
          parent_category: parent_category || null,
          parent_value: parent_value || null,
          status: "ACTIVE",
        },
      ])
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
    const session = await getSession();
    let authCheck = canPerformAction(session, "highways:master_data_manage");
    if (!authCheck.allowed) {
      authCheck = canPerformAction(session, "master_data:manage");
    }
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { id, category, oldValue, newValue, parent_value, parent_category } = await request.json();

    if (!newValue || typeof newValue !== "string" || newValue.trim() === "") {
      return NextResponse.json({ error: "New option value is required" }, { status: 400 });
    }

    const cleanNewValue = newValue.trim();

    if (id) {
      const updatePayload: Record<string, unknown> = {
        value: cleanNewValue,
        updated_at: new Date().toISOString(),
      };
      if (parent_value !== undefined) updatePayload.parent_value = parent_value?.trim() || null;
      if (parent_category !== undefined) updatePayload.parent_category = parent_category?.trim() || null;

      const { data, error } = await supabase
        .from("highway_master_config")
        .update(updatePayload)
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
        .from("highway_master_config")
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
    const session = await getSession();
    let authCheck = canPerformAction(session, "highways:master_data_manage");
    if (!authCheck.allowed) {
      authCheck = canPerformAction(session, "master_data:manage");
    }
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");
    const value = searchParams.get("value");

    const nowIso = new Date().toISOString();

    if (id) {
      const { error } = await supabase
        .from("highway_master_config")
        .update({ status: "DELETED", updated_at: nowIso })
        .eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (category && value) {
      const { error } = await supabase
        .from("highway_master_config")
        .update({ status: "DELETED", updated_at: nowIso })
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
