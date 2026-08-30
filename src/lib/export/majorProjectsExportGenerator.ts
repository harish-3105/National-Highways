import * as XLSX from 'xlsx';
import { MajorProject } from '@/app/api/major-projects/route';

export interface MajorProjectExportColumn {
  key: keyof MajorProject | 'effective_cost_cr' | 'status_label';
  label: string;
  category: 'core' | 'contract' | 'physical' | 'financial' | 'timeline' | 'engineering' | 'bottlenecks';
  defaultSelected: boolean;
}

export const MAJOR_PROJECTS_EXPORT_COLUMNS: MajorProjectExportColumn[] = [
  // Core Identification
  { key: 's_no', label: 'S.No', category: 'core', defaultSelected: true },
  { key: 'circle', label: 'Circle', category: 'core', defaultSelected: true },
  { key: 'division', label: 'Division', category: 'core', defaultSelected: true },
  { key: 'scheme', label: 'Scheme', category: 'core', defaultSelected: true },
  { key: 'name_of_work', label: 'Name of Work', category: 'core', defaultSelected: true },
  { key: 'pmis_id', label: 'PMIS ID', category: 'core', defaultSelected: true },
  { key: 'old_new_nh', label: 'Old / New NH No.', category: 'core', defaultSelected: true },
  { key: 'job_no', label: 'Job No.', category: 'core', defaultSelected: true },
  { key: 'length_km', label: 'Total Length (km)', category: 'core', defaultSelected: true },

  // Sanction, Agreement & Contract
  { key: 'sanction_date', label: 'Sanction Date', category: 'contract', defaultSelected: true },
  { key: 'loa_date', label: 'Date of Issue of LOA', category: 'contract', defaultSelected: true },
  { key: 'agreement_date', label: 'Date of Agreement', category: 'contract', defaultSelected: true },
  { key: 'contract_value_cr', label: 'Contract Value (₹ Cr)', category: 'contract', defaultSelected: true },
  { key: 'site_handover_date', label: 'Site Handover Date', category: 'contract', defaultSelected: true },
  { key: 'appointed_date', label: 'Appointed Date / Date of Start', category: 'contract', defaultSelected: true },
  { key: 'scheduled_completion_date', label: 'Scheduled Date of Completion', category: 'contract', defaultSelected: true },

  // Physical Progress
  { key: 'completed_length_prior_km', label: 'Completed Length till 31.03.2026 (km)', category: 'physical', defaultSelected: true },
  { key: 'completed_length_current_fy_km', label: 'Completed Length in 2026-27 (km)', category: 'physical', defaultSelected: true },
  { key: 'total_completed_length_km', label: 'Total Completed Length (km)', category: 'physical', defaultSelected: true },
  { key: 'progress_percent', label: 'Physical Progress (%)', category: 'physical', defaultSelected: true },
  { key: 'work_stage', label: 'Work Stage', category: 'physical', defaultSelected: true },

  // Financial Progress
  { key: 'project_cost_cr', label: 'Sanctioned Cost (₹ Cr)', category: 'financial', defaultSelected: true },
  { key: 'revised_cost_cr', label: 'Revised Cost / Anticipated (₹ Cr)', category: 'financial', defaultSelected: true },
  { key: 'cost_increase_rce_cr', label: 'Increase in Cost due to RCE (₹ Cr)', category: 'financial', defaultSelected: true },
  { key: 'expenditure_prior_cr', label: 'Expenditure upto 31.03.2026 (₹ Cr)', category: 'financial', defaultSelected: true },
  { key: 'expenditure_current_fy_cr', label: 'Expenditure in 2026-27 (₹ Cr)', category: 'financial', defaultSelected: true },
  { key: 'cumm_financial_expenditure_cr', label: 'Cumm. Financial Expenditure (₹ Cr)', category: 'financial', defaultSelected: true },
  { key: 'contract_cum_expenditure_cr', label: 'Cumulative Contract Value Expenditure (₹ Cr)', category: 'financial', defaultSelected: true },

  // Timeline & Overrun
  { key: 'likely_completion_date', label: 'Likely Date of Completion', category: 'timeline', defaultSelected: true },
  { key: 'probable_completion_date', label: 'Likely / Actual Date of Completion', category: 'timeline', defaultSelected: true },
  { key: 'time_overrun_years', label: 'Time Overrun in Years', category: 'timeline', defaultSelected: true },
  { key: 'eot_granted_till', label: 'EOT Granted Till', category: 'timeline', defaultSelected: true },
  { key: 'eot_proposal_agency', label: 'Further EOT Proposal with Agency', category: 'timeline', defaultSelected: true },

  // Engineering & Personnel
  { key: 'cos_details', label: 'COS Details', category: 'engineering', defaultSelected: true },
  { key: 'de_name_phone', label: 'Divisional Engineer Name & Phone', category: 'engineering', defaultSelected: true },
  { key: 'contractor_name', label: 'Contractor Name', category: 'engineering', defaultSelected: true },
  { key: 'detailed_stage_status', label: 'Detailed Stage Status (Col 27 Log)', category: 'engineering', defaultSelected: true },
  { key: 'progress_remarks', label: 'Progress Remarks', category: 'engineering', defaultSelected: true },
  { key: 'updated_division_date', label: 'Updated Division & Date', category: 'engineering', defaultSelected: true },

  // Clearance Bottlenecks
  { key: 'issue_land', label: 'Land Acquisition Clearance', category: 'bottlenecks', defaultSelected: true },
  { key: 'issue_forest', label: 'Forest Clearance', category: 'bottlenecks', defaultSelected: true },
  { key: 'issue_utility', label: 'Utility Shifting Clearance', category: 'bottlenecks', defaultSelected: true },
  { key: 'issue_railways', label: 'Railways Clearance', category: 'bottlenecks', defaultSelected: true },
  { key: 'issue_others', label: 'Other Issues & Bottlenecks', category: 'bottlenecks', defaultSelected: true },
];

export interface MajorProjectsExportOptions {
  selectedKeys: string[];
  format: 'csv' | 'xlsx';
  fileNamePrefix?: string;
}

export function generateMajorProjectsExportFile(
  data: MajorProject[],
  options: MajorProjectsExportOptions
) {
  if (!data || data.length === 0) {
    throw new Error('No works selected or available for export.');
  }

  const activeColumns = MAJOR_PROJECTS_EXPORT_COLUMNS.filter((col) =>
    options.selectedKeys.includes(col.key)
  );

  if (activeColumns.length === 0) {
    throw new Error('Please select at least one column to export.');
  }

  const formattedData = data.map((project, idx) => {
    const rowObj: Record<string, unknown> = {};
    activeColumns.forEach((col) => {
      let val: unknown = (project as unknown as Record<string, unknown>)[col.key];

      if (col.key === 's_no') {
        val = idx + 1;
      } else if (col.key === 'work_stage') {
        val =
          project.work_stage === 'COMPLETED'
            ? 'Completed'
            : project.work_stage === 'TENDER_STAGE'
            ? 'Tender Stage'
            : 'In Progress';
      } else if (col.key === 'progress_percent') {
        val =
          project.progress_percent !== null && project.progress_percent !== undefined
            ? `${project.progress_percent}%`
            : '';
      }

      if (val === null || val === undefined) {
        val = '';
      }

      rowObj[col.label] = val;
    });
    return rowObj;
  });

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `${options.fileNamePrefix || 'TN_NH_Ongoing_Works'}_${timestamp}`;

  if (options.format === 'csv') {
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `${fileName}.csv`);
  } else {
    const worksheet = XLSX.utils.json_to_sheet(formattedData);

    const colWidths = activeColumns.map((col) => {
      const maxContentLen = Math.max(
        col.label.length,
        ...formattedData.map((r) => String(r[col.label] || '').length)
      );
      return { wch: Math.min(Math.max(maxContentLen + 2, 12), 60) };
    });
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ongoing Works');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    triggerDownload(blob, `${fileName}.xlsx`);
  }
}

function triggerDownload(blob: Blob, fullFileName: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fullFileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
