import { NextRequest, NextResponse } from "next/server";
import { createMockSupabaseClient } from "@/lib/mock/mockSupabase";
import { getSession } from "@/lib/auth/session";
import { canPerformAction, canAssignRole } from "@/lib/auth/permissions";
import { logAudit } from "@/lib/audit/logger";

export const dynamic = "force-dynamic";

function getSupabaseClient() {
  return createMockSupabaseClient();
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const authCheck = canPerformAction(session, "staff:view");
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized" }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database service unavailable" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const office = searchParams.get("office");
    const circle = searchParams.get("circle");
    const division = searchParams.get("division");
    const sub_division = searchParams.get("sub_division");
    const search = searchParams.get("search");
    const includeDeleted = searchParams.get("include_deleted") === "true";

    let query = supabase.from("staff_members").select("*").order("created_at", { ascending: false });

    if (!includeDeleted) {
      query = query.eq("delete_status", "ACTIVE");
    }

    if (office && office !== "All Offices") query = query.eq("office", office);
    if (circle && circle !== "All Circles") query = query.eq("circle", circle);
    if (division && division !== "All Divisions") query = query.eq("division", division);
    if (sub_division && sub_division !== "All Sub-Divisions") query = query.eq("sub_division", sub_division);

    if (search) {
      const cleanSearch = search.replace(/[,()"]/g, '').trim();
      if (cleanSearch) {
        query = query.or(`name.ilike.%${cleanSearch}%,designation.ilike.%${cleanSearch}%,contact_no.ilike.%${cleanSearch}%,emailid.ilike.%${cleanSearch}%`);
      }
    }

    const { data: staffList, error: staffError } = await query;
    if (staffError) {
      return NextResponse.json({ error: staffError.message }, { status: 500 });
    }

    // Fetch matching user_profiles to join login status & role
    const staffIds = (staffList || []).map((s: any) => s.id);
    let profilesByStaffId: Record<string, any> = {};

    if (staffIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select(`
          id,
          staff_id,
          role_id,
          is_active,
          totp_enabled,
          roles (
            id,
            name,
            position,
            is_system_role
          )
        `)
        .in("staff_id", staffIds);

      if (profiles) {
        profiles.forEach((p: any) => {
          if (p.staff_id) {
            profilesByStaffId[p.staff_id] = p;
          }
        });
      }
    }

    const merged = (staffList || []).map((s: any) => {
      const p = profilesByStaffId[s.id];
      return {
        ...s,
        user_profile: p ? {
          id: p.id,
          role_id: p.role_id,
          role_name: (p.roles as any)?.name || 'Viewer',
          role_position: (p.roles as any)?.position || 0,
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

    let oldStaff: Record<string, unknown> | null = null;
    if (!isNew && id) {
      const { data: fetchedStaff, error: fetchErr } = await supabase
        .from("staff_members")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }
      if (!fetchedStaff) {
        return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
      }
      oldStaff = fetchedStaff;
    }

    const authCheck = canPerformAction(
      session,
      requiredPerm,
      isNew
        ? { circle: circle || null, division: division || null }
        : { circle: (oldStaff?.circle as string) || null, division: (oldStaff?.division as string) || null }
    );

    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Staff Name is required" }, { status: 400 });
    }

    // Validate role assignment hierarchy if role_id is specified
    if (role_id) {
      const { data: targetRole, error: roleError } = await supabase
        .from("roles")
        .select("id, name, position")
        .eq("id", role_id)
        .maybeSingle();

      if (roleError || !targetRole) {
        return NextResponse.json({ error: "Invalid role_id specified." }, { status: 400 });
      }

      const roleAssignCheck = canAssignRole(session, targetRole.position);
      if (!roleAssignCheck.allowed) {
        return NextResponse.json(
          { error: roleAssignCheck.error || "Hierarchy boundary: You cannot assign this role." },
          { status: 403 }
        );
      }
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing staff member id" }, { status: 400 });
    }

    const session = await getSession();

    const { data: staffMember, error: fetchErr } = await supabase
      .from("staff_members")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    let authCheck = canPerformAction(session, "staff:restore", {
      circle: staffMember.circle || null,
      division: staffMember.division || null,
    });
    if (!authCheck.allowed) {
      authCheck = canPerformAction(session, "staff:edit", {
        circle: staffMember.circle || null,
        division: staffMember.division || null,
      });
    }
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (searchParams.get("hard") === "true" || searchParams.get("permanent") === "true") {
      return NextResponse.json(
        { error: "Permanent deletion is not available through the application. Contact your database administrator." },
        { status: 403 }
      );
    }

    if (!id) {
      return NextResponse.json({ error: "Missing staff member id" }, { status: 400 });
    }

    const session = await getSession();

    const { data: existingStaff, error: fetchErr } = await supabase
      .from("staff_members")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!existingStaff) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    const authCheck = canPerformAction(session, "staff:delete", {
      circle: existingStaff.circle || null,
      division: existingStaff.division || null,
    });
    if (!authCheck.allowed) {
      return NextResponse.json({ error: authCheck.reason || "Unauthorized operation." }, { status: 403 });
    }

    const { error } = await supabase
      .from("staff_members")
      .update({ delete_status: "DELETED", updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Suspend login access while archived
    await supabase.from("user_profiles").update({ is_active: false }).eq("staff_id", id);

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

    return NextResponse.json({
      success: true,
      message: "Staff member soft deleted successfully",
    });
  } catch (err: any) {
    console.error("DELETE /api/staff error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete staff member" }, { status: 500 });
  }
}
