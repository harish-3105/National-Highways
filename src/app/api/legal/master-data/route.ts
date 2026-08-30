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
  | "case_type"
  | "case_status"
  | "case_pertains_to"
  | "nature_of_case"
  | "court_name"
  | "law_officer"
  | "petition_type"
  | "converted_category"
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
  parent_value?: string | null;
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
  petitionTypes: string[];
  convertedCategories: string[];
  appealCaseTypes: string[];
  appellateCourts: string[];
  condonationOfDelays: string[];
  presentStages: string[];
  gpOpinions: string[];
  complianceStatuses: string[];
}

function groupLegalMasterData(items: LegalMasterConfigItem[]): LegalMasterData {
  const sourceItems = Array.isArray(items) ? items : [];
  const getVals = (cat: LegalCategory) => {
    const dbVals = sourceItems.filter((i) => i.category === cat).map((i) => i.value);
    return Array.from(new Set(dbVals)).sort();
  };

  return {
    rawItems: sourceItems,
    circles: getVals("circle"),
    divisions: getVals("division"),
    caseTypes: getVals("case_type"),
    caseStatuses: getVals("case_status"),
    casePertainsTo: getVals("case_pertains_to"),
    natureOfCases: getVals("nature_of_case"),
    courtNames: getVals("court_name"),
    lawOfficers: getVals("law_officer"),
    petitionTypes: getVals("petition_type"),
    convertedCategories: getVals("converted_category"),
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

    const body = await request.json();
    const { category, value, parent_value, parentValue } = body;

    if (!category || !value || typeof value !== "string" || value.trim() === "") {
      return NextResponse.json({ error: "Category and value are required" }, { status: 400 });
    }

    const validCategories: LegalCategory[] = [
      "circle",
      "division",
      "case_type",
      "case_status",
      "case_pertains_to",
      "nature_of_case",
      "court_name",
      "law_officer",
      "petition_type",
      "converted_category",
      "appeal_case_type",
      "appellate_court",
      "condonation_of_delay",
      "present_stage",
      "gp_opinion",
      "compliance_status",
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: `Invalid category '${category}'` }, { status: 400 });
    }

    const trimmedValue = value.trim();
    const cleanParentValue = (parent_value || parentValue || "").toString().trim() || null;

    // Check duplicate in database
    let query = supabase
      .from("legal_master_config")
      .select("id")
      .eq("category", category)
      .eq("value", trimmedValue);

    if (cleanParentValue) {
      query = query.eq("parent_value", cleanParentValue);
    }

    const { data: existing } = await query.maybeSingle();

    if (existing) {
      return NextResponse.json({ error: `Option '${trimmedValue}' already exists in '${category}'` }, { status: 409 });
    }

    const insertPayload: { category: string; value: string; parent_value?: string | null } = {
      category,
      value: trimmedValue,
      parent_value: cleanParentValue,
    };

    const { data, error } = await supabase
      .from("legal_master_config")
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, item: data }, { status: 201 });
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

    const body = await request.json();
    const { id, category, oldValue, value, newValue, parent_value, parentValue } = body;

    const valToSet = (value || newValue || "").toString().trim();
    if (!valToSet) {
      return NextResponse.json({ error: "Value is required for update" }, { status: 400 });
    }

    const cleanParent = parent_value !== undefined || parentValue !== undefined
      ? (parent_value || parentValue || "").toString().trim() || null
      : undefined;

    const updatePayload: Record<string, any> = { value: valToSet };
    if (cleanParent !== undefined) {
      updatePayload.parent_value = cleanParent;
    }

    if (id) {
      const { data, error } = await supabase
        .from("legal_master_config")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, item: data });
    }

    if (category && oldValue) {
      const { data, error } = await supabase
        .from("legal_master_config")
        .update(updatePayload)
        .eq("category", category)
        .eq("value", oldValue.trim())
        .select();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, items: data });
    }

    return NextResponse.json({ error: "Provide either 'id' or 'category' and 'oldValue'" }, { status: 400 });
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

    const { id, category, value } = await request.json();

    if (id) {
      const { error } = await supabase.from("legal_master_config").delete().eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (category && value) {
      const { error } = await supabase
        .from("legal_master_config")
        .delete()
        .eq("category", category)
        .eq("value", value);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Provide either 'id' or 'category' and 'value'" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("DELETE /api/legal/master-data error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
