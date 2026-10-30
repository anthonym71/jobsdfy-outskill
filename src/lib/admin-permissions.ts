export type AdminAccess = "owner" | "team" | "judge" | null;
export const adminPermissions = (access: AdminAccess) => ({
  canViewAdmin: access !== null,
  canEditAdmin: access === "owner" || access === "team",
  canManageRoles: access === "owner",
  canDeleteUsers: access === "owner",
  canChangeSettings: access === "owner",
});