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
  | "converted_category"
  | "appeal_level"
  | "appeal_case_type"
  | "appellate_court"
  | "condonation_of_delay"
  | "present_stage"
  | "gp_opinion"
  | "compliance_status";

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
  appealLevels: string[];
  appealCaseTypes: string[];
  appellateCourts: string[];
  condonationOfDelays: string[];
  presentStages: string[];
  gpOpinions: string[];
  complianceStatuses: string[];
}

const DEFAULT_LEGAL_ITEMS: LegalMasterConfigItem[] = [
  { id: "def-1", category: "circle", value: "Chennai" },
  { id: "def-2", category: "circle", value: "Madurai" },
  { id: "def-3", category: "circle", value: "Salem" },
  { id: "def-4", category: "circle", value: "Coimbatore" },
  { id: "def-5", category: "circle", value: "Tirunelveli" },
  { id: "def-6", category: "circle", value: "Villupuram" },

  { id: "def-7", category: "division", value: "Chennai City Division" },
  { id: "def-8", category: "division", value: "Chengalpattu Division" },
  { id: "def-9", category: "division", value: "Tiruvallur Division" },
  { id: "def-10", category: "division", value: "Madurai Division" },
  { id: "def-11", category: "division", value: "Dindigul Division" },
  { id: "def-12", category: "division", value: "Theni Division" },
  { id: "def-13", category: "division", value: "Salem Division" },
  { id: "def-14", category: "division", value: "Namakkal Division" },
  { id: "def-15", category: "division", value: "Dharmapuri Division" },
  { id: "def-16", category: "division", value: "Coimbatore Division" },
  { id: "def-17", category: "division", value: "Tirunelveli Division" },
  { id: "def-18", category: "division", value: "Villupuram Division" },

  { id: "def-19", category: "category", value: "Filed Against Department" },
  { id: "def-20", category: "category", value: "Filed By Department" },

  { id: "def-21", category: "case_type", value: "WP" },
  { id: "def-22", category: "case_type", value: "WA" },
  { id: "def-23", category: "case_type", value: "CRP" },
  { id: "def-24", category: "case_type", value: "OSA" },
  { id: "def-25", category: "case_type", value: "SLP" },
  { id: "def-26", category: "case_type", value: "Contempt Petition" },
  { id: "def-27", category: "case_type", value: "CMP" },
  { id: "def-28", category: "case_type", value: "Review Petition" },
  { id: "def-29", category: "case_type", value: "OP" },
  { id: "def-30", category: "case_type", value: "OS" },
  { id: "def-31", category: "case_type", value: "AS" },
  { id: "def-32", category: "case_type", value: "CMA" },
  { id: "def-33", category: "case_type", value: "LAOP" },
  { id: "def-34", category: "case_type", value: "EP" },

  { id: "def-35", category: "case_status", value: "Pending" },
  { id: "def-36", category: "case_status", value: "Disposed" },
  { id: "def-37", category: "case_status", value: "Stay Granted" },
  { id: "def-38", category: "case_status", value: "Interim Order Issued" },
  { id: "def-39", category: "case_status", value: "Dismissed" },
  { id: "def-40", category: "case_status", value: "Allowed in Favour of Dept" },
  { id: "def-41", category: "case_status", value: "Allowed Adverse to Dept" },

  { id: "def-42", category: "case_pertains_to", value: "GOTN" },
  { id: "def-43", category: "case_pertains_to", value: "MoRTH" },
  { id: "def-44", category: "case_pertains_to", value: "Both" },
  { id: "def-45", category: "case_pertains_to", value: "NHAI" },

  { id: "def-46", category: "nature_of_case", value: "Work" },
  { id: "def-47", category: "nature_of_case", value: "Tender" },
  { id: "def-48", category: "nature_of_case", value: "Land Acquisition" },
  { id: "def-49", category: "nature_of_case", value: "Encroachment" },
  { id: "def-50", category: "nature_of_case", value: "Arbitration / Dispute" },
  { id: "def-51", category: "nature_of_case", value: "Service Matter" },
  { id: "def-52", category: "nature_of_case", value: "Enhanced Compensation" },
  { id: "def-53", category: "nature_of_case", value: "Quash G.O." },
  { id: "def-54", category: "nature_of_case", value: "Injunction" },
  { id: "def-55", category: "nature_of_case", value: "Declaration" },

  { id: "def-56", category: "court_name", value: "High Court Madras" },
  { id: "def-57", category: "court_name", value: "Madurai Bench of Madras HC" },
  { id: "def-58", category: "court_name", value: "Principal Sub Court" },
  { id: "def-59", category: "court_name", value: "District Court" },
  { id: "def-60", category: "court_name", value: "Supreme Court of India" },

  { id: "def-61", category: "appeal_level", value: "High Court Single Bench to Division Bench" },
  { id: "def-62", category: "appeal_level", value: "District / Sub Court to High Court" },
  { id: "def-63", category: "appeal_level", value: "High Court to Supreme Court (SLP)" },
  { id: "def-64", category: "appeal_level", value: "Tribunal Appeal" },

  { id: "def-65", category: "appeal_case_type", value: "Writ Appeal (WA)" },
  { id: "def-66", category: "appeal_case_type", value: "Civil Miscellaneous Appeal (CMA)" },
  { id: "def-67", category: "appeal_case_type", value: "Original Side Appeal (OSA)" },
  { id: "def-68", category: "appeal_case_type", value: "Special Leave Petition (SLP)" },
  { id: "def-69", category: "appeal_case_type", value: "Review Petition" },

  { id: "def-70", category: "appellate_court", value: "Madras High Court Principal Bench" },
  { id: "def-71", category: "appellate_court", value: "Madurai Bench of Madras HC" },
  { id: "def-72", category: "appellate_court", value: "Supreme Court of India" },

  { id: "def-73", category: "condonation_of_delay", value: "Pending" },
  { id: "def-74", category: "condonation_of_delay", value: "Allowed / Condoned" },
  { id: "def-75", category: "condonation_of_delay", value: "Dismissed" },
  { id: "def-76", category: "condonation_of_delay", value: "Not Applicable" },

  { id: "def-77", category: "present_stage", value: "Notice / Admission" },
  { id: "def-78", category: "present_stage", value: "Counter Affidavit Pending" },
  { id: "def-79", category: "present_stage", value: "Interim Stay in Operation" },
  { id: "def-80", category: "present_stage", value: "Final Arguments" },
  { id: "def-81", category: "present_stage", value: "Orders Reserved" },
  { id: "def-82", category: "present_stage", value: "Disposed" },

  { id: "def-83", category: "gp_opinion", value: "Fit for Appeal" },
  { id: "def-84", category: "gp_opinion", value: "Not Fit for Appeal" },
  { id: "def-85", category: "gp_opinion", value: "Awaiting Opinion" },
  { id: "def-86", category: "gp_opinion", value: "Implement Order" },

  { id: "def-87", category: "compliance_status", value: "Complied" },
  { id: "def-88", category: "compliance_status", value: "Pending Action" },
  { id: "def-89", category: "compliance_status", value: "Challenged in Appeal" },
  { id: "def-90", category: "compliance_status", value: "Stayed by Appellate Court" },
];

function groupLegalMasterData(items: LegalMasterConfigItem[]): LegalMasterData {
  const sourceItems = items && items.length > 0 ? items : DEFAULT_LEGAL_ITEMS;
  const getVals = (cat: LegalCategory) => {
    const dbVals = sourceItems.filter((i) => i.category === cat).map((i) => i.value);
    return Array.from(new Set(dbVals)).sort();
  };

  return {
    rawItems: sourceItems,
    circles: getVals("circle"),
    divisions: getVals("division"),
    categories: getVals("category"),
    caseTypes: getVals("case_type"),
    caseStatuses: getVals("case_status"),
    casePertainsTo: getVals("case_pertains_to"),
    natureOfCases: getVals("nature_of_case"),
    courtNames: getVals("court_name"),
    lawOfficers: getVals("law_officer"),
    petitionTypes: getVals("petition_type"),
    convertedCategories: getVals("converted_category"),
    appealLevels: getVals("appeal_level"),
    appealCaseTypes: getVals("appeal_case_type"),
    appellateCourts: getVals("appellate_court"),
    condonationOfDelays: getVals("condonation_of_delay"),
    presentStages: getVals("present_stage"),
    gpOpinions: getVals("gp_opinion"),
    complianceStatuses: getVals("compliance_status"),
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
      console.warn("Notice: legal_master_config DB read:", error.message);
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
      "appeal_level",
      "appeal_case_type",
      "appellate_court",
      "condonation_of_delay",
      "present_stage",
      "gp_opinion",
      "compliance_status",
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
      return NextResponse.json({ error: "ID and new value are required" }, { status: 400 });
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
      return NextResponse.json({ error: "Config ID is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("legal_master_config")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting legal master config item:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/legal/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
