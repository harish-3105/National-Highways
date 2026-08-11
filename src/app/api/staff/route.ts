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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("include_deleted") === "true";

    let query = supabase.from("staff_members").select("*").order("created_at", { ascending: false });

    if (!includeDeleted) {
      query = query.neq("delete_status", "DELETED");
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching staff members:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("GET /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      id,
      office,
      circle,
      division,
      sub_division,
      section,
      sub_section,
      designation,
      name,
      contact_no,
      emailid
    } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Staff Name is required" }, { status: 400 });
    }

    const payload = {
      office: office || null,
      circle: circle || null,
      division: division || null,
      sub_division: sub_division || null,
      section: section || null,
      sub_section: sub_section || null,
      designation: designation || null,
      name: name.trim(),
      contact_no: contact_no || null,
      emailid: emailid || null,
      updated_at: new Date().toISOString()
    };

    if (id) {
      const { data, error } = await supabase
        .from("staff_members")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data);
    } else {
      const { data, error } = await supabase
        .from("staff_members")
        .insert([{ ...payload, delete_status: "ACTIVE" }])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json(data, { status: 201 });
    }
  } catch (err: any) {
    console.error("POST /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to save staff member" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Missing staff member id" }, { status: 400 });
    }

    if (permanent) {
      const { error } = await supabase.from("staff_members").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("staff_members")
        .update({ delete_status: "DELETED", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Staff member deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete staff member" }, { status: 500 });
  }
}
