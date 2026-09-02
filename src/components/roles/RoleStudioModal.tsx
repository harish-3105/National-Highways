'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
  Lock,
  Save,
  Loader2,
  Users,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Layers,
} from 'lucide-react';
import { SessionUser } from '@/lib/auth/session';

interface RolePermission {
  code: string;
  module: string;
  label: string;
  description: string;
}

interface RoleData {
  id: string;
  name: string;
  position: number;
  default_scope: string;
  is_system_role: boolean;
  description?: string;
  permissions: string[];
  memberCount: number;
}

interface RoleStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SessionUser | null;
}

export function RoleStudioModal({ isOpen, onClose, currentUser }: RoleStudioModalProps) {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [permissionsCatalog, setPermissionsCatalog] = useState<RolePermission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Editing state for selected role
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [editScope, setEditScope] = useState<string>('DIVISION');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  // Create role state
  const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false);
  const [newRoleName, setNewRoleName] = useState<string>('');
  const [newRoleScope, setNewRoleScope] = useState<string>('DIVISION');

  // Load Roles & Catalog
  const fetchRoles = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load roles');

      setRoles(data.roles || []);
      setPermissionsCatalog(data.permissionsCatalog || []);

      if (data.roles && data.roles.length > 0 && !selectedRoleId) {
        selectRole(data.roles[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error fetching roles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  const selectRole = (role: RoleData) => {
    setSelectedRoleId(role.id);
    setEditName(role.name);
    setEditDescription(role.description || '');
    setEditScope(role.default_scope || 'DIVISION');
    setEditPermissions([...role.permissions]);
    setIsCreatingRole(false);
    setErrorMsg('');
    setSuccessMsg('');
  };

  if (!isOpen) return null;

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || null;

  // Discord Invariant Rule: Can actor edit this role?
  const canEditSelectedRole =
    currentUser?.isSuperAdmin ||
    (selectedRole &&
      !selectedRole.is_system_role &&
      selectedRole.position < (currentUser?.position || 0));

  // Handle Permission Toggle
  const handleTogglePermission = (code: string) => {
    if (!canEditSelectedRole) return;
    if (editPermissions.includes(code)) {
      setEditPermissions(editPermissions.filter((p) => p !== code));
    } else {
      setEditPermissions([...editPermissions, code]);
    }
  };

  // Handle Save Role Changes
  const handleSaveRole = async () => {
    if (!selectedRole || !canEditSelectedRole) return;
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          default_scope: editScope,
          permissions: editPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role');

      setSuccessMsg(`Role "${data.role.name}" updated successfully!`);
      await fetchRoles();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving role');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Create New Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;

    setIsSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName.trim(),
          default_scope: newRoleScope,
          permissions: ['works:view', 'highways:view', 'dlp:view', 'legal:view', 'fee_bills:view', 'staff:view'],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create role');

      setNewRoleName('');
      setIsCreatingRole(false);
      await fetchRoles();
      selectRole(data.role);
      setSuccessMsg(`Created new role "${data.role.name}"`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating role');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Role
  const handleDeleteRole = async (role: RoleData) => {
    if (role.is_system_role) {
      alert('System baseline roles cannot be deleted.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete role "${role.name}"? Active members will be reassigned to Viewer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/roles/${role.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete role');

      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Error deleting role');
    }
  };

  // Handle Move Role Position Up or Down
  const handleMoveRole = async (index: number, direction: 'UP' | 'DOWN') => {
    const customRoles = roles.filter((r) => !r.is_system_role);
    const targetIdx = customRoles.findIndex((r) => r.id === roles[index].id);
    if (targetIdx === -1) return;

    const swapIdx = direction === 'UP' ? targetIdx - 1 : targetIdx + 1;
    if (swapIdx < 0 || swapIdx >= customRoles.length) return;

    const reordered = [...customRoles];
    const temp = reordered[targetIdx];
    reordered[targetIdx] = reordered[swapIdx];
    reordered[swapIdx] = temp;

    const orderedIds = reordered.map((r) => r.id);

    try {
      const res = await fetch('/api/roles/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedRoleIds: orderedIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reorder roles');

      await fetchRoles();
    } catch (err: any) {
      alert(err.message || 'Error reordering roles');
    }
  };

  // Group permissions catalog by Module
  const permissionsByModule: Record<string, RolePermission[]> = {};
  permissionsCatalog.forEach((p) => {
    if (!permissionsByModule[p.module]) permissionsByModule[p.module] = [];
    permissionsByModule[p.module].push(p);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xs shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Role Hierarchy & Permissions Studio
                </h3>
                <span className="px-1.5 py-0.5 rounded-xs text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                  Discord Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Configure hierarchical position ranks, atomic permission matrices, and scope boundaries.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Role Hierarchy Stack (Discord Style) */}
          <div className="w-full md:w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-900/40">
            {/* Header & Add Button */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                Role Stack ({roles.length})
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingRole(true)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xs transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3 h-3" />
                <span>Add Role</span>
              </button>
            </div>

            {/* Create Role Inline Form */}
            {isCreatingRole && (
              <form onSubmit={handleCreateRole} className="p-3 bg-blue-50/60 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900 space-y-2">
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Role Name (e.g. Assistant Engineer)"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                  <select
                    value={newRoleScope}
                    onChange={(e) => setNewRoleScope(e.target.value)}
                    className="w-1/2 px-2 py-1 text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xs font-semibold"
                  >
                    <option value="DIVISION">Division Scope</option>
                    <option value="CIRCLE">Circle Scope</option>
                    <option value="STATEWIDE">Statewide Scope</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isSaving || !newRoleName.trim()}
                    className="w-1/2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xs"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Role List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {roles.map((role, idx) => {
                const isSelected = role.id === selectedRoleId;
                const isCustom = !role.is_system_role;

                return (
                  <div
                    key={role.id}
                    className={`flex items-center justify-between p-2 rounded-xs border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/70 border-blue-400 dark:border-blue-700 ring-1 ring-blue-500/20'
                        : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                    onClick={() => selectRole(role)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {role.is_system_role ? (
                        <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {role.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span className="font-mono font-bold">Pos {role.position}</span>
                          <span>•</span>
                          <span>{role.memberCount} staff</span>
                        </div>
                      </div>
                    </div>

                    {/* Reorder and Delete Actions for Custom Roles */}
                    {isCustom && (
                      <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleMoveRole(idx, 'UP')}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Move Role Up"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveRole(idx, 'DOWN')}
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xs hover:bg-slate-200 dark:hover:bg-slate-700"
                          title="Move Role Down"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRole(role)}
                          className="p-1 text-red-400 hover:text-red-600 rounded-xs hover:bg-red-50 dark:hover:bg-red-950/40"
                          title="Delete Role"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Discord Permission Checkbox Matrix */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            {selectedRole ? (
              <>
                {/* Role Edit Header Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          disabled={!canEditSelectedRole}
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="text-sm font-extrabold text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-650 focus:border-blue-500 focus:outline-none px-1 py-0.5 rounded-xs"
                        />
                        <span className="px-1.5 py-0.2 rounded-xs text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono">
                          Rank Position {selectedRole.position}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 px-1 mt-0.5">
                        {selectedRole.is_system_role
                          ? 'System Baseline Role (Immutable Anchor)'
                          : 'Custom Departmental Role'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Default Scope:</span>
                      <select
                        disabled={!canEditSelectedRole}
                        value={editScope}
                        onChange={(e) => setEditScope(e.target.value)}
                        className="px-2 py-1 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xs"
                      >
                        <option value="DIVISION">DIVISION</option>
                        <option value="CIRCLE">CIRCLE</option>
                        <option value="STATEWIDE">STATEWIDE</option>
                        <option value="SUB_DIVISION">SUB_DIVISION</option>
                      </select>
                    </div>

                    {canEditSelectedRole && (
                      <button
                        type="button"
                        onClick={handleSaveRole}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xs transition-colors cursor-pointer shadow-xs"
                      >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        <span>Save Permissions</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                {errorMsg && (
                  <div className="m-4 p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 rounded-xs text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                {successMsg && (
                  <div className="m-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 rounded-xs text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                {/* Checkbox Matrix Grouped by Module */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                    <div key={moduleName} className="border border-slate-200 dark:border-slate-800 rounded-xs p-4 bg-slate-50/40 dark:bg-slate-800/30">
                      <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center justify-between">
                        <span>{moduleName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {perms.filter((p) => editPermissions.includes(p.code)).length} / {perms.length} Active
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {perms.map((perm) => {
                          const isChecked =
                            selectedRole.name === 'Super Admin' ||
                            editPermissions.includes(perm.code) ||
                            editPermissions.includes('*:*');

                          const actorOwnsPerm =
                            currentUser?.isSuperAdmin ||
                            currentUser?.permissions.includes(perm.code) ||
                            currentUser?.permissions.includes('*:*');

                          const isDisabled = !canEditSelectedRole || !actorOwnsPerm;

                          return (
                            <label
                              key={perm.code}
                              className={`flex items-start gap-2.5 p-2 rounded-xs border transition-all text-left ${
                                isChecked
                                  ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800'
                                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                              } ${
                                isDisabled
                                  ? 'opacity-60 cursor-not-allowed'
                                  : 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-600'
                              }`}
                              title={
                                !actorOwnsPerm
                                  ? 'You cannot grant a permission you do not personally possess (Anti-Escalation Rule).'
                                  : perm.description
                              }
                            >
                              <input
                                type="checkbox"
                                disabled={isDisabled}
                                checked={isChecked}
                                onChange={() => handleTogglePermission(perm.code)}
                                className="mt-0.5 rounded-xs text-blue-600 focus:ring-blue-500"
                              />
                              <div className="min-w-0">
                                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                                  {perm.label}
                                </div>
                                <div className="text-[9.5px] font-mono text-slate-400 truncate">
                                  {perm.code}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
                <p className="text-xs">Select a role from the left stack to configure its permissions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
