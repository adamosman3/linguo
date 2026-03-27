"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Settings,
  Database,
  Download,
  Upload,
  Info,
  Users,
  Plus,
  Edit3,
  Trash2,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all features and settings", color: "bg-red-100 text-red-800" },
  { value: "manager", label: "Manager", description: "Manage projects, users, and approve translations", color: "bg-purple-100 text-purple-800" },
  { value: "translator", label: "Translator", description: "Translate strings and submit for review", color: "bg-blue-100 text-blue-800" },
  { value: "reviewer", label: "Reviewer", description: "Review and approve/reject translations", color: "bg-green-100 text-green-800" },
  { value: "viewer", label: "Viewer", description: "Read-only access to projects and translations", color: "bg-gray-100 text-gray-800" },
];

function getRoleBadge(role: string) {
  const r = ROLES.find((r) => r.value === role) || ROLES[4];
  return <Badge className={`${r.color} text-xs`}>{r.label}</Badge>;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [exportLoading, setExportLoading] = React.useState(false);
  const [users, setUsers] = React.useState<User[]>([]);
  const [usersLoading, setUsersLoading] = React.useState(true);
  const [showUserDialog, setShowUserDialog] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<User | null>(null);
  const [savingUser, setSavingUser] = React.useState(false);
  const [userForm, setUserForm] = React.useState({ name: "", email: "", password: "", role: "translator" });
  const [userError, setUserError] = React.useState("");

  React.useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => { setUsers(data); setUsersLoading(false); })
      .catch(() => setUsersLoading(false));
  }, []);

  const resetUserForm = () => {
    setUserForm({ name: "", email: "", password: "", role: "translator" });
    setUserError("");
    setEditingUser(null);
  };

  const handleOpenAddUser = () => {
    resetUserForm();
    setShowUserDialog(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({ name: user.name, email: user.email, password: "", role: user.role });
    setUserError("");
    setShowUserDialog(true);
  };

  const handleSaveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setUserError("Name and email are required");
      return;
    }
    if (!editingUser && !userForm.password.trim()) {
      setUserError("Password is required for new users");
      return;
    }
    if (userForm.password && userForm.password.length < 6) {
      setUserError("Password must be at least 6 characters");
      return;
    }
    setSavingUser(true);
    setUserError("");
    try {
      if (editingUser) {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        if (!res.ok) {
          const data = await res.json();
          setUserError(data.error || "Failed to update user");
          return;
        }
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        if (!res.ok) {
          const data = await res.json();
          setUserError(data.error || "Failed to create user");
          return;
        }
        const created = await res.json();
        setUsers((prev) => [created, ...prev]);
      }
      setShowUserDialog(false);
      resetUserForm();
    } finally {
      setSavingUser(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  };

  const handleExportProject = async (format: string) => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/projects");
      const projects = await res.json();

      if (format === "json") {
        const blob = new Blob([JSON.stringify(projects, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "projects-export.json";
        a.click();
        URL.revokeObjectURL(url);
      }
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your translation management system
        </p>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="export">Export / Import</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>
                      Create, edit, and assign roles to team members
                    </CardDescription>
                  </div>
                  <Button onClick={handleOpenAddUser}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-xs text-muted-foreground">Total Users</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{users.filter((u) => u.status === "active").length}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{users.filter((u) => u.role === "admin").length}</p>
                    <p className="text-xs text-muted-foreground">Admins</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-2xl font-bold">{users.filter((u) => u.status === "inactive").length}</p>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                  </div>
                </div>

                {usersLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="mb-4 h-16 w-16 text-muted-foreground/30" />
                    <h3 className="text-lg font-medium">No users yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Add team members and assign them roles
                    </p>
                    <Button className="mt-4" onClick={handleOpenAddUser}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add First User
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Added</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map((user) => (
                          <tr key={user.id} className={`hover:bg-muted/30 ${user.status === "inactive" ? "opacity-60" : ""}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                  {user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{user.name}</p>
                                  <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {getRoleBadge(user.role)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant={user.status === "active" ? "success" : "secondary"}
                                className="text-xs cursor-pointer"
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.status === "active" ? (
                                  <><UserCheck className="mr-1 h-3 w-3" /> Active</>
                                ) : (
                                  <><UserX className="mr-1 h-3 w-3" /> Inactive</>
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleOpenEditUser(user)} title="Edit user">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)} title="Delete user">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Role Permissions
                </CardTitle>
                <CardDescription>Overview of what each role can do</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {ROLES.map((role) => (
                    <div key={role.value} className="flex items-center gap-4 rounded-lg border p-3">
                      <Badge className={`${role.color} text-xs w-24 justify-center`}>{role.label}</Badge>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="general">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Configure default behavior for the translation system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Source Language</label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                    Configure this on the Languages page
                  </p>
                  <a href="/languages">
                    <Button variant="outline" size="sm">Manage Languages</Button>
                  </a>
                </div>
                <div>
                  <label className="text-sm font-medium">Translation Engine</label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-1">
                    Configure Cloudflare Workers AI on the Integrations page
                  </p>
                  <a href="/integrations">
                    <Button variant="outline" size="sm">Manage Integrations</Button>
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database
                </CardTitle>
                <CardDescription>
                  SQLite database stored locally
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-4">
                  <p className="text-sm">
                    Database location: <code className="bg-background px-1.5 py-0.5 rounded text-xs">prisma/dev.db</code>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Back up this file regularly to preserve your translation data.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="export">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Export your projects and translations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => handleExportProject("json")}
                  disabled={exportLoading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {exportLoading ? "Exporting..." : "Export All Projects (JSON)"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Import Data
                </CardTitle>
                <CardDescription>
                  Import strings from files
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border-2 border-dashed p-8 text-center">
                  <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Import coming soon</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Support for JSON, XLIFF, CSV, and PO file formats
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                About Linguo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">Linguo - Translation Management System</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  An internal translation management platform for localizing website content
                  and email campaigns across Iterable and Marketo.
                </p>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Features</h4>
                <div className="grid gap-2 md:grid-cols-2">
                  {[
                    "Project-based translation management",
                    "Cloudflare Workers AI machine translation",
                    "Translation Memory for reuse",
                    "Glossary for consistent terminology",
                    "Iterable email integration",
                    "Marketo email integration",
                    "Multi-language support (30+ languages)",
                    "Translation review workflow",
                  ].map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Badge variant="secondary" className="h-2 w-2 p-0 rounded-full" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-sm mb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {["Next.js 14", "React", "TypeScript", "Tailwind CSS", "Prisma", "SQLite", "Cloudflare Workers AI"].map(
                    (tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit User Dialog */}
      <Dialog
        open={showUserDialog}
        onOpenChange={(open) => {
          setShowUserDialog(open);
          if (!open) resetUserForm();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Update user details and role assignment"
                : "Add a new team member and assign them a role"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {userError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                {userError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Full Name *</label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Jane Smith"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email Address *</label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="e.g., jane@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Password {editingUser ? "(leave blank to keep current)" : "*"}</label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))}
                placeholder={editingUser ? "Leave blank to keep current password" : "Minimum 6 characters"}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <div className="mt-2 space-y-2">
                {ROLES.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                      userForm.role === role.value
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={userForm.role === role.value}
                      onChange={(e) => setUserForm((p) => ({ ...p, role: e.target.value }))}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{role.label}</span>
                        <Badge className={`${role.color} text-[10px]`}>{role.value}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowUserDialog(false); resetUserForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser} disabled={savingUser || !userForm.name.trim() || !userForm.email.trim()}>
              {savingUser ? "Saving..." : editingUser ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
