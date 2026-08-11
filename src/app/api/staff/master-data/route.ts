import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }
  return createClient(url, key);
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
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
    const { category, value } = await request.json();

    if (!category || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
    }

    const cleanCategory = category.trim().toLowerCase();
    const cleanValue = value.trim();

    const { data, error } = await supabase
      .from("staff_master_config")
      .insert([{ category: cleanCategory, value: cleanValue }])
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

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
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

function groupMasterData(items: any[]) {
  const offices = Array.from(new Set(items.filter(i => i.category === "office").map(i => i.value)));
  const circles = Array.from(new Set(items.filter(i => i.category === "circle").map(i => i.value)));
  const divisions = Array.from(new Set(items.filter(i => i.category === "division").map(i => i.value)));
  const sub_divisions = Array.from(new Set(items.filter(i => i.category === "sub_division").map(i => i.value)));
  const sections = Array.from(new Set(items.filter(i => i.category === "section").map(i => i.value)));
  const sub_sections = Array.from(new Set(items.filter(i => i.category === "sub_section").map(i => i.value)));
  const designations = Array.from(new Set(items.filter(i => i.category === "designation").map(i => i.value)));

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
