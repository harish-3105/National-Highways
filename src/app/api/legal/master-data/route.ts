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

export type LegalCategory =
  | "circle"
  | "division"
  | "case_type"
  | "case_status"
  | "case_pertains_to"
  | "nature_of_case"
  | "court_name"
  | "law_officer";

export interface LegalMasterConfigItem {
  id: string;
  category: LegalCategory;
  value: string;
  created_at?: string;
}

export interface LegalMasterData {
  rawItems: LegalMasterConfigItem[];
  circles: string[];
  divisions: string[];
  caseTypes: string[];
  caseStatuses: string[];
  casePertainsTo: string[];
  natureOfCases: string[];
  courtNames: string[];
  lawOfficers: string[];
}

const DEFAULT_CIRCLES = ["Chennai", "Madurai", "Salem", "Coimbatore", "Tirunelveli", "Villupuram"];
const DEFAULT_DIVISIONS = [
  "Chennai City Division",
  "Chengalpattu Division",
  "Tiruvallur Division",
  "Madurai Division",
  "Dindigul Division",
  "Theni Division",
  "Salem Division",
  "Namakkal Division",
  "Dharmapuri Division",
  "Coimbatore Division",
  "Tirunelveli Division",
  "Villupuram Division",
];
const DEFAULT_CASE_TYPES = [
  "Writ Petition (WP)",
  "Writ Appeal (WA)",
  "Civil Revision Petition (CRP)",
  "Original Side Appeal (OSA)",
  "Special Leave Petition (SLP)",
  "Contempt Petition",
  "Civil Miscellaneous Petition (CMP)",
  "Review Application",
  "Original Petition (OP)",
];
const DEFAULT_CASE_STATUSES = [
  "Pending",
  "Disposed",
  "Stay Granted",
  "Interim Order",
  "Dismissed",
  "Allowed",
  "Remanded",
];
const DEFAULT_CASE_PERTAINS_TO = ["GOTN", "MoRTH", "Both", "NHAI"];
const DEFAULT_NATURE_OF_CASES = [
  "Work",
  "Tender",
  "Land Acquisition",
  "Encroachment",
  "Arbitration",
  "Service Matter",
  "Other",
];
const DEFAULT_COURT_NAMES = [
  "High Court of Madras (Principal Seat, Chennai)",
  "High Court of Madras (Madurai Bench)",
  "Supreme Court of India (New Delhi)",
  "City Civil Court, Chennai",
  "District Court Complex",
  "Subordinate Court",
  "National Green Tribunal (Southern Zone)",
];
const DEFAULT_LAW_OFFICERS = [
  "Advocate General of Tamil Nadu",
  "Additional Advocate General",
  "Special Government Pleader (Highways)",
  "Additional Government Pleader",
  "Government Advocate (Civil Side)",
  "Standing Counsel (MoRTH / NHAI)",
];

function groupMasterData(items: LegalMasterConfigItem[]): LegalMasterData {
  const getVals = (cat: LegalCategory) =>
    items.filter((i) => i.category === cat).map((i) => i.value);

  const circles = Array.from(new Set([...DEFAULT_CIRCLES, ...getVals("circle")])).sort();
  const divisions = Array.from(new Set([...DEFAULT_DIVISIONS, ...getVals("division")])).sort();
  const caseTypes = Array.from(new Set([...DEFAULT_CASE_TYPES, ...getVals("case_type")])).sort();
  const caseStatuses = Array.from(
    new Set([...DEFAULT_CASE_STATUSES, ...getVals("case_status")])
  ).sort();
  const casePertainsTo = Array.from(
    new Set([...DEFAULT_CASE_PERTAINS_TO, ...getVals("case_pertains_to")])
  ).sort();
  const natureOfCases = Array.from(
    new Set([...DEFAULT_NATURE_OF_CASES, ...getVals("nature_of_case")])
  ).sort();
  const courtNames = Array.from(
    new Set([...DEFAULT_COURT_NAMES, ...getVals("court_name")])
  ).sort();
  const lawOfficers = Array.from(
    new Set([...DEFAULT_LAW_OFFICERS, ...getVals("law_officer")])
  ).sort();

  return {
    rawItems: items,
    circles,
    divisions,
    caseTypes,
    caseStatuses,
    casePertainsTo,
    natureOfCases,
    courtNames,
    lawOfficers,
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(groupMasterData([]));
    }

    const { data, error } = await supabase
      .from("legal_master_config")
      .select("*")
      .order("category", { ascending: true })
      .order("value", { ascending: true });

    if (error) {
      console.warn("legal_master_config table query note:", error.message);
      return NextResponse.json(groupMasterData([]));
    }

    return NextResponse.json(groupMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/legal/master-data error:", msg);
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

    const cleanCategory = category.trim().toLowerCase() as LegalCategory;
    const allowed = [
      "circle",
      "division",
      "case_type",
      "case_status",
      "case_pertains_to",
      "nature_of_case",
      "court_name",
      "law_officer",
    ];
    if (!allowed.includes(cleanCategory)) {
      return NextResponse.json(
        { error: `Category must be one of: ${allowed.join(", ")}` },
        { status: 400 }
      );
    }

    const cleanValue = value.trim();

    const { data, error } = await supabase
      .from("legal_master_config")
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
        .from("legal_master_config")
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
        .from("legal_master_config")
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
      const { error } = await supabase.from("legal_master_config").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (category && value) {
      const { error } = await supabase
        .from("legal_master_config")
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
