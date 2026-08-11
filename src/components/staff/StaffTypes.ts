export interface StaffMember {
  id: string;
  office: string | null;
  circle: string | null;
  division: string | null;
  sub_division: string | null;
  section: string | null;
  sub_section: string | null;
  designation: string | null;
  name: string;
  contact_no: string | null;
  emailid: string | null;
  delete_status?: "ACTIVE" | "DELETED";
  created_at?: string;
  updated_at?: string;
}

export interface StaffMasterConfig {
  rawItems: { id?: string; category: string; value: string }[];
  offices: string[];
  circles: string[];
  divisions: string[];
  sub_divisions: string[];
  sections: string[];
  sub_sections: string[];
  designations: string[];
}
