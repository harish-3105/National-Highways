export type DlpWorkCategory = 'DLP' | 'CONSTRUCTION' | 'STMC' | 'PBMC' | 'NO_DLP';

export type DlpRecordStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export interface DlpWorkStretch {
  id?: string;
  corridor_id?: string;
  category: DlpWorkCategory;
  chainage_from_km: number;
  chainage_to_km: number;
  length_km: number;
  road_width_from_m: number;
  road_width_to_m: number;
  contractor_name?: string | null;
  work_name?: string | null;
  commencement_date?: string | null;
  dlp_till_date?: string | null;
  physical_progress_pct?: number | null;
  actual_completion_date?: string | null;
  dlp_period_years?: number | null;
  scheme?: string | null;
  dlp_ended_on_date?: string | null;
  remarks?: string | null;
  status?: DlpRecordStatus;
  created_at?: string;
  updated_at?: string;
  // Computed helper fields for UI
  days_remaining?: number;
  computed_status?: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'COMPLETED';
}

export interface DlpCorridor {
  id: string;
  division_name: string;
  highway_code: string;
  from_km: number;
  to_km: number;
  total_length_km: number;
  remarks?: string | null;
  status?: DlpRecordStatus;
  created_at?: string;
  updated_at?: string;
  work_stretches?: DlpWorkStretch[];
}

export type DlpMasterConfigCategory = 'circle' | 'division' | 'scheme';

export interface DlpMasterConfigItem {
  id: string;
  category: DlpMasterConfigCategory | string;
  value: string;
  parent_category?: string | null;
  parent_value?: string | null;
  status?: DlpRecordStatus;
  created_at?: string;
  updated_at?: string;
}

export interface DlpMasterData {
  rawItems: DlpMasterConfigItem[];
  circles: string[];
  divisions: string[];
  schemes: string[];
  circleDivisionMap: Record<string, string[]>;
}

