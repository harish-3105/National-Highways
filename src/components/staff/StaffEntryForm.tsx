'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Save,
  Users,
  AlertCircle,
  FileText,
  Building,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  CheckCircle2,
} from 'lucide-react';
import { StaffMember, StaffMasterConfig } from './StaffTypes';
import { SearchableSelect } from '@/components/common/SearchableSelect';

interface StaffEntryFormProps {
  initialData?: Partial<StaffMember>;
  masterConfig: StaffMasterConfig;
  onSave: (staffData: Partial<StaffMember>) => Promise<void> | void;
  onCancel: () => void;
}

export const StaffEntryForm: React.FC<StaffEntryFormProps> = ({
  initialData,
  masterConfig,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState<string>(initialData?.name || '');
  const [designation, setDesignation] = useState<string>(initialData?.designation || '');
  const [contactNo, setContactNo] = useState<string>(initialData?.contact_no || '');
  const [emailId, setEmailId] = useState<string>(initialData?.emailid || '');

  // 6-Tier Organizational Hierarchy
  const [office, setOffice] = useState<string>(initialData?.office || '');
  const [circle, setCircle] = useState<string>(initialData?.circle || '');
  const [division, setDivision] = useState<string>(initialData?.division || '');
  const [subDivision, setSubDivision] = useState<string>(initialData?.sub_division || '');
  const [section, setSection] = useState<string>(initialData?.section || '');
  const [subSection, setSubSection] = useState<string>(initialData?.sub_section || '');

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Staff Member Name is required.';
    if (emailId.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId.trim())) {
      newErrors.emailId = 'Please enter a valid email address.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    const payload: Partial<StaffMember> = {
      ...(initialData?.id ? { id: initialData.id } : {}),
      name: name.trim(),
      designation: designation || null,
      office: office || null,
      circle: circle || null,
      division: division || null,
      sub_division: subDivision || null,
      section: section || null,
      sub_section: subSection || null,
      contact_no: contactNo.trim() || null,
      emailid: emailId.trim() || null,
    };

    try {
      await onSave(payload);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Staff Directory
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {initialData?.id ? 'Edit Department Staff Profile' : 'New Staff Officer Entry'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Highways Personnel Portal &bull; Organizational Units & 6-Tier Posting Hierarchy
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {loading ? 'Saving Profile...' : 'Save Staff Profile'}
          </button>
        </div>
      </div>

      {/* Validation Diagnostic Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl p-4 text-rose-800 dark:text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-sm block mb-1">
              Please resolve the following required fields ({Object.keys(errors).length}):
            </strong>
            <ul className="list-disc pl-5 space-y-0.5 font-medium">
              {Object.entries(errors).map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* MODULE 1: Personal & Contact Information */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-blue-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 1: Personnel Identity & Professional Designation
            </h3>
            <span className="text-xs text-blue-200">
              Officer name, official designation, contact mobile number, and departmental email
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Officer Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Er. M. Rajesh Kumar"
                required
              />
              {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Official Designation
              </label>
              <SearchableSelect
                options={masterConfig.designations.length > 0 ? masterConfig.designations : ['Superintending Engineer', 'Divisional Engineer', 'Assistant Divisional Engineer', 'Assistant Engineer']}
                value={designation}
                onChange={setDesignation}
                placeholder="Select Designation..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Contact Mobile Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={contactNo}
                  onChange={(e) => setContactNo(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="e.g. 9443012345"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Departmental / Official Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={emailId}
                  onChange={(e) => {
                    setEmailId(e.target.value);
                    if (errors.emailId) setErrors((prev) => ({ ...prev, emailId: '' }));
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. de.salem.nh@tn.gov.in"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
              {errors.emailId && <p className="text-[11px] text-rose-500 mt-1">{errors.emailId}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* MODULE 2: 6-Tier Organizational Posting Hierarchy */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 px-6 py-4 text-white flex items-center gap-3">
          <Building className="w-5 h-5 text-indigo-300" />
          <div>
            <h3 className="font-bold text-sm uppercase tracking-wider text-white">
              MODULE 2: 6-Tier Organizational Unit & Field Hierarchy
            </h3>
            <span className="text-xs text-indigo-200">
              Posting assignment across Office, Circle, Division, Sub-Division, Section, and Sub-Section
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                1. Office Level
              </label>
              <SearchableSelect
                options={masterConfig.offices.length > 0 ? masterConfig.offices : ['Headquarters', 'Circle Office', 'Division Office', 'Sub-Division Office']}
                value={office}
                onChange={setOffice}
                placeholder="Select Office..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                2. Circle
              </label>
              <SearchableSelect
                options={masterConfig.circles.length > 0 ? masterConfig.circles : ['Chennai', 'Salem', 'Madurai', 'Coimbatore', 'Tirunelveli', 'Villupuram']}
                value={circle}
                onChange={setCircle}
                placeholder="Select Circle..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                3. Division
              </label>
              <SearchableSelect
                options={masterConfig.divisions.length > 0 ? masterConfig.divisions : ['Salem', 'Madurai', 'Chennai', 'Dharapuram', 'Tirunelveli', 'Villupuram', 'Thanjavur']}
                value={division}
                onChange={setDivision}
                placeholder="Select Division..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                4. Sub-Division
              </label>
              <SearchableSelect
                options={masterConfig.sub_divisions}
                value={subDivision}
                onChange={setSubDivision}
                placeholder="Select Sub-Division..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                5. Section
              </label>
              <SearchableSelect
                options={masterConfig.sections}
                value={section}
                onChange={setSection}
                placeholder="Select Section..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                6. Sub-Section / Wing
              </label>
              <SearchableSelect
                options={masterConfig.sub_sections}
                value={subSection}
                onChange={setSubSection}
                placeholder="Select Sub-Section..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {loading ? 'Saving Profile...' : 'Save Complete Staff Profile'}
        </button>
      </div>
    </form>
  );
};

export default StaffEntryForm;
