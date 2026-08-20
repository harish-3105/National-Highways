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
  | "category"
  | "case_type"
  | "case_status"
  | "case_pertains_to"
  | "nature_of_case"
  | "court_name"
  | "law_officer"
  | "petition_type"
  | "converted_category";

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
  categories: string[];
  caseTypes: string[];
  caseStatuses: string[];
  casePertainsTo: string[];
  natureOfCases: string[];
  courtNames: string[];
  lawOfficers: string[];
  petitionTypes: string[];
  convertedCategories: string[];
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
const DEFAULT_CATEGORIES = ["Filed Against Department", "Filed By Department"];
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
  "National Green Tribunal (NGT), Southern Zone",
  "Arbitral Tribunal",
  "District Court Complex",
];
const DEFAULT_LAW_OFFICERS = [
  "Advocate General of Tamil Nadu",
  "Additional Advocate General",
  "Special Government Pleader (Highways)",
  "Additional Government Pleader",
  "Government Advocate (Civil Side)",
  "Standing Counsel (Highways)",
];
const DEFAULT_PETITION_TYPES = [
  "Review Petition",
  "Contempt Petition",
  "Execution Petition",
  "Special Leave Petition (SLP)",
  "Writ Appeal (WA)",
  "Other",
];
const DEFAULT_CONVERTED_CATEGORIES = [
  "Appealed by Department",
  "Appealed by Other Party",
  "Other",
];

function groupLegalMasterData(items: LegalMasterConfigItem[]): LegalMasterData {
  const getVals = (cat: LegalCategory, defs: string[]) => {
    const dbVals = items.filter((i) => i.category === cat).map((i) => i.value);
    return Array.from(new Set(dbVals.length > 0 ? dbVals : defs)).sort();
  };

  return {
    rawItems: items,
    circles: getVals("circle", DEFAULT_CIRCLES),
    divisions: getVals("division", DEFAULT_DIVISIONS),
    categories: getVals("category", DEFAULT_CATEGORIES),
    caseTypes: getVals("case_type", DEFAULT_CASE_TYPES),
    caseStatuses: getVals("case_status", DEFAULT_CASE_STATUSES),
    casePertainsTo: getVals("case_pertains_to", DEFAULT_CASE_PERTAINS_TO),
    natureOfCases: getVals("nature_of_case", DEFAULT_NATURE_OF_CASES),
    courtNames: getVals("court_name", DEFAULT_COURT_NAMES),
    lawOfficers: getVals("law_officer", DEFAULT_LAW_OFFICERS),
    petitionTypes: getVals("petition_type", DEFAULT_PETITION_TYPES),
    convertedCategories: getVals("converted_category", DEFAULT_CONVERTED_CATEGORIES),
  };
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(groupLegalMasterData([]));
    }

    const { data, error } = await supabase
      .from("legal_master_config")
      .select("*")
      .order("category", { ascending: true })
      .order("value", { ascending: true });

    if (error) {
      console.warn("Notice: legal_master_config DB read, using fallbacks:", error.message);
      return NextResponse.json(groupLegalMasterData([]));
    }

    return NextResponse.json(groupLegalMasterData(data || []));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("GET /api/legal/master-data error:", msg);
    return NextResponse.json(groupLegalMasterData([]));
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

    const validCategories: LegalCategory[] = [
      "circle",
      "division",
      "category",
      "case_type",
      "case_status",
      "case_pertains_to",
      "nature_of_case",
      "court_name",
      "law_officer",
      "petition_type",
      "converted_category",
    ];

    const cleanCategory = category.trim().toLowerCase() as LegalCategory;
    if (!validCategories.includes(cleanCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    const cleanValue = value.trim();

    // Check duplicate
    const { data: existing } = await supabase
      .from("legal_master_config")
      .select("id")
      .eq("category", cleanCategory)
      .ilike("value", cleanValue)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Option "${cleanValue}" already exists in ${cleanCategory}` }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("legal_master_config")
      .insert([{ category: cleanCategory, value: cleanValue }])
      .select()
      .single();

    if (error) {
      console.error("Error creating legal master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /api/legal/master-data error:", msg);
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
      .from("legal_master_config")
      .update({ value: cleanValue })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating legal master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("PUT /api/legal/master-data error:", msg);
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
      .from("legal_master_config")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting legal master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Deleted successfully" });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/legal/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
