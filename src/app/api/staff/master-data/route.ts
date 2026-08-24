import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { StaffMasterItem } from "@/components/staff/StaffTypes";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/^["']|["']$/g, "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").replace(/^["']|["']$/g, "").trim();
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(groupMasterData([]));
    }

    const { data, error } = await supabase
      .from("staff_master_config")
      .select("*")
      .order("category", { ascending: true })
      .order("value", { ascending: true });

    if (error) {
      console.error("Error fetching staff master config:", error);
      return NextResponse.json(groupMasterData([]));
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: any) {
    console.error("GET /api/staff/master-data error:", err);
    return NextResponse.json(groupMasterData([]));
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { category, value, parent_category, parent_value } = await request.json();

    if (!category || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
    }

    const cleanCategory = category.trim().toLowerCase();
    const cleanValue = value.trim();
    const cleanParentCategory = parent_category ? String(parent_category).trim().toLowerCase() : null;
    const cleanParentValue = parent_value ? String(parent_value).trim() : null;

    const { data, error } = await supabase
      .from("staff_master_config")
      .insert([{
        category: cleanCategory,
        value: cleanValue,
        parent_category: cleanParentCategory,
        parent_value: cleanParentValue,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "This option already exists in this category" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/staff/master-data error:", err);
    return NextResponse.json({ error: err.message || "Failed to add master data option" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database client unavailable" }, { status: 500 });
    }

    const { id, category, oldValue, newValue, parent_category, parent_value } = await request.json();

    if (!newValue || typeof newValue !== "string" || newValue.trim() === "") {
      return NextResponse.json({ error: "New option value is required" }, { status: 400 });
    }

    const cleanNewValue = newValue.trim();
    const cleanParentCategory = parent_category !== undefined ? (parent_category ? String(parent_category).trim().toLowerCase() : null) : undefined;
    const cleanParentValue = parent_value !== undefined ? (parent_value ? String(parent_value).trim() : null) : undefined;

    if (id) {
      const { data: existing } = await supabase.from("staff_master_config").select("*").eq("id", id).single();
      
      const updatePayload: Record<string, any> = { value: cleanNewValue };
      if (cleanParentCategory !== undefined) updatePayload.parent_category = cleanParentCategory;
      if (cleanParentValue !== undefined) updatePayload.parent_value = cleanParentValue;

      const { data, error } = await supabase
        .from("staff_master_config")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json({ error: "An option with this name already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 1. Sync staff members table
      if (existing && existing.category && existing.value) {
        const catColumn = existing.category;
        if (["office", "circle", "division", "sub_division", "section", "sub_section", "designation"].includes(catColumn)) {
          await (supabase.from("staff_members") as any).update({ [catColumn]: cleanNewValue }).eq(catColumn, existing.value);
        }

        // 2. Cascade rename to child master data options where parent_value matched old value
        await (supabase.from("staff_master_config") as any)
          .update({ parent_value: cleanNewValue })
          .eq("parent_category", catColumn)
          .eq("parent_value", existing.value);
      }

      return NextResponse.json(data);
    } else if (category && oldValue) {
      const cleanCategory = category.trim().toLowerCase();
      const cleanOldValue = oldValue.trim();

      const updatePayload: Record<string, any> = { value: cleanNewValue };
      if (cleanParentCategory !== undefined) updatePayload.parent_category = cleanParentCategory;
      if (cleanParentValue !== undefined) updatePayload.parent_value = cleanParentValue;

      let { data, error } = await supabase
        .from("staff_master_config")
        .update(updatePayload)
        .eq("category", cleanCategory)
        .eq("value", cleanOldValue)
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // If not existed as row yet, insert it
      if (!data || data.length === 0) {
        const insertRes = await supabase
          .from("staff_master_config")
          .insert([{
            category: cleanCategory,
            value: cleanNewValue,
            parent_category: cleanParentCategory || null,
            parent_value: cleanParentValue || null,
          }])
          .select();
        data = insertRes.data;
      }

      // 1. Sync staff members
      if (["office", "circle", "division", "sub_division", "section", "sub_section", "designation"].includes(cleanCategory)) {
        await (supabase.from("staff_members") as any).update({ [cleanCategory]: cleanNewValue }).eq(cleanCategory, cleanOldValue);
      }

      // 2. Cascade rename to child master data options
      await (supabase.from("staff_master_config") as any)
        .update({ parent_value: cleanNewValue })
        .eq("parent_category", cleanCategory)
        .eq("parent_value", cleanOldValue);

      return NextResponse.json(data ? data[0] : { category: cleanCategory, value: cleanNewValue });
    } else {
      return NextResponse.json({ error: "Missing id or category/oldValue parameters" }, { status: 400 });
    }
  } catch (err: any) {
    console.error("PUT /api/staff/master-data error:", err);
    return NextResponse.json({ error: err.message || "Failed to update master data option" }, { status: 500 });
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
    const purgeAll = searchParams.get("purge_all") === "true";

    if (purgeAll) {
      const { error } = await supabase.from("staff_master_config").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: "All options purged" });
    }

    if (id) {
      const { error } = await supabase.from("staff_master_config").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (category && value) {
      const { error } = await supabase
        .from("staff_master_config")
        .delete()
        .eq("category", category)
        .eq("value", value);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: "Missing id or category/value parameters" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Option deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/staff/master-data error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete option" }, { status: 500 });
  }
}

function groupMasterData(items: StaffMasterItem[]) {
  const offices = Array.from(new Set(items.filter(i => i.category === "office").map(i => i.value))).sort();
  const circles = Array.from(new Set(items.filter(i => i.category === "circle").map(i => i.value))).sort();
  const divisions = Array.from(new Set(items.filter(i => i.category === "division").map(i => i.value))).sort();
  const sub_divisions = Array.from(new Set(items.filter(i => i.category === "sub_division").map(i => i.value))).sort();
  const sections = Array.from(new Set(items.filter(i => i.category === "section").map(i => i.value))).sort();
  const sub_sections = Array.from(new Set(items.filter(i => i.category === "sub_section").map(i => i.value))).sort();
  const designations = Array.from(new Set(items.filter(i => i.category === "designation").map(i => i.value))).sort();

  return {
    rawItems: items,
    offices,
    circles,
    divisions,
    sub_divisions,
    sections,
    sub_sections,
    designations
  };
}
