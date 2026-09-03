import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSession } from "@/lib/auth/session";
import { canPerformAction, canAssignRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/logger";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "").replace(/^["']|["']$/g, "").trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "").replace(/^["']|["']$/g, "").trim();
  if (!url || !key) {
    return null;
  }
  return createClient(url, key);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json([]);
    }

    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("include_deleted") === "true";

    let query = supabase.from("staff_members").select("*").order("created_at", { ascending: false });

    if (!includeDeleted) {
      query = query.neq("delete_status", "DELETED");
    }

    const { data: staffList, error } = await query;

    if (error) {
      console.error("Error fetching staff members:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch user profiles to display login status & roles in staff directory
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, staff_id, phone_number, role_id, is_active, totp_enabled, roles ( id, name, position )");

    const profileMap = new Map((profiles || []).filter(p => p.staff_id).map((p: any) => [p.staff_id, p]));

    const merged = (staffList || []).map((s: any) => {
      const p = profileMap.get(s.id);
      return {
        ...s,
        user_profile: p ? {
          id: p.id,
          role_id: p.role_id,
          role_name: p.roles?.name || 'Viewer',
          position: p.roles?.position || 0,
          is_active: p.is_active,
          totp_enabled: p.totp_enabled,
        } : null,
      };
    });

    return NextResponse.json(merged);
  } catch (err: any) {
    console.error("GET /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch staff members" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 500 });
    }

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
      emailid,
      role_id, // Optional custom role assignment on staff creation
    } = body;

    const session = await getSession();
    const isNew = !id;
    const requiredPerm = isNew ? "staff:create" : "staff:edit";

    const authCheck = canPerformAction(session, requiredPerm, {
      circle: circle || null,
      division: division || null,
    });

    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

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
      const { data: oldStaff } = await supabase.from("staff_members").select("*").eq("id", id).maybeSingle();

      const { data, error } = await supabase
        .from("staff_members")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Sync user profile if contact_no or name changed
      if (contact_no) {
        const tenDigit = contact_no.trim().replace(/[\s-]/g, '').slice(-10);
        const updateFields: any = {
          full_name: name.trim(),
          circle: circle || null,
          division: division || null,
          sub_division: sub_division || null,
          phone_number: tenDigit,
        };
        if (role_id) updateFields.role_id = role_id;

        await supabase
          .from("user_profiles")
          .update(updateFields)
          .eq("staff_id", id);
      }

      // Log Tamper-Proof Audit
      if (session) {
        await logAudit({
          actor: session,
          module: "STAFF",
          action: "UPDATE",
          entityId: String(id),
          entityTitle: `Staff: ${name.trim()} (${designation || "Officer"})`,
          changesSummary: `Updated personnel record for ${name.trim()} in ${division || "jurisdiction"}`,
          oldState: oldStaff,
          newState: data,
        });
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

      // Log Tamper-Proof Audit
      if (session) {
        await logAudit({
          actor: session,
          module: "STAFF",
          action: "CREATE",
          entityId: String(data.id),
          entityTitle: `Staff: ${name.trim()} (${designation || "Officer"})`,
          changesSummary: `Registered new personnel ${name.trim()} in ${division || "jurisdiction"}`,
          newState: data,
        });
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

export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 500 });
    }

    const session = await getSession();
    let authCheck = canPerformAction(session, "staff:restore");
    if (!authCheck.allowed) {
      authCheck = canPerformAction(session, "staff:edit");
    }
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing staff member id" }, { status: 400 });
    }

    const { data: staffMember } = await supabase.from("staff_members").select("*").eq("id", id).maybeSingle();

    const { error } = await supabase
      .from("staff_members")
      .update({ delete_status: "ACTIVE", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Reactivate login account if exists
    await supabase.from("user_profiles").update({ is_active: true }).eq("staff_id", id);

    // Log Tamper-Proof Audit
    if (session && staffMember) {
      await logAudit({
        actor: session,
        module: "STAFF",
        action: "RESTORE",
        entityId: id,
        entityTitle: `Staff: ${staffMember.name} (${staffMember.designation || "Officer"})`,
        changesSummary: `Restored archived staff member ${staffMember.name}`,
        oldState: staffMember,
      });
    }

    return NextResponse.json({ success: true, message: "Staff member restored successfully" });
  } catch (err: any) {
    console.error("PATCH /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to restore staff member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 500 });
    }

    const session = await getSession();
    const authCheck = canPerformAction(session, "staff:delete");
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Missing staff member id" }, { status: 400 });
    }

    const { data: existingStaff } = await supabase.from("staff_members").select("*").eq("id", id).maybeSingle();

    if (permanent) {
      await supabase.from("user_profiles").delete().eq("staff_id", id);
      const { error } = await supabase.from("staff_members").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from("staff_members")
        .update({ delete_status: "DELETED", updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Suspend login access while archived
      await supabase.from("user_profiles").update({ is_active: false }).eq("staff_id", id);
    }

    // Log Tamper-Proof Audit
    if (session && existingStaff) {
      await logAudit({
        actor: session,
        module: "STAFF",
        action: "DELETE",
        entityId: id,
        entityTitle: `Staff: ${existingStaff.name} (${existingStaff.designation || "Officer"})`,
        changesSummary: `Soft-deleted/archived staff member ${existingStaff.name}`,
        oldState: existingStaff,
      });
    }

    return NextResponse.json({ success: true, message: "Staff member soft deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete staff member" }, { status: 500 });
  }
}
