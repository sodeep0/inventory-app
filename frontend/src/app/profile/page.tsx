"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhosphorIcon } from "@/components/icons";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient, getErrorMessage } from "@/lib/api";
import { toast } from "sonner";
import withAuth from "@/components/withAuth";

function ProfilePage() {
  const { user: authUser, logout } = useAuth();
  const router = useRouter();

  const [name, setName] = useState(authUser?.username || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Low stock alert preferences
  const [alertEnabled, setAlertEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lowStockAlertsEnabled") === "true";
    }
    return false;
  });
  const [alertEmail, setAlertEmail] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lowStockAlertEmail") || authUser?.email || "";
    }
    return authUser?.email || "";
  });
  const [isSavingAlertPrefs, setIsSavingAlertPrefs] = useState(false);

  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (name.trim().length < 3 || name.trim().length > 30) {
      toast.error("Username must be 3-30 characters");
      return;
    }

    setIsUpdatingName(true);
    try {
      await apiClient.put("/auth/me", { username: name.trim() });
      // Update local storage
      if (authUser?.token) {
        const userData = { ...authUser, username: name.trim() };
        localStorage.setItem("user", JSON.stringify(userData));
      }
      toast.success("Name updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.put("/auth/password", {
        currentPassword,
        newPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete("/auth/me");
      logout();
      toast.success("Account deleted successfully");
      router.push("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSaveAlertPrefs = async () => {
    if (alertEnabled && (!alertEmail || !alertEmail.includes("@"))) {
      toast.error("Please enter a valid email address for alerts");
      return;
    }

    setIsSavingAlertPrefs(true);
    try {
      localStorage.setItem("lowStockAlertsEnabled", String(alertEnabled));
      localStorage.setItem("lowStockAlertEmail", alertEmail);
      toast.success("Alert preferences saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSavingAlertPrefs(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <h1
          className="text-3xl tracking-tight"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)", letterSpacing: "-0.02em" }}
        >
          Profile Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* Current User Info */}
      <div className="rounded-lg border border-border/60 p-6 bg-card">
        <h2
          className="text-lg font-medium mb-4"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}
        >
          Account Information
        </h2>
        <div className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">Email</span>
            <p className="font-medium">{authUser?.email || "—"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Username</span>
            <p className="font-medium">{authUser?.username || "—"}</p>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="rounded-lg border border-border/60 p-6 bg-card">
        <h2
          className="text-lg font-medium mb-4 flex items-center gap-2"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}
        >
          <PhosphorIcon name="WarningCircle" size={18} />
          Low Stock Alerts
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Enable Email Alerts</p>
              <p className="text-xs text-muted-foreground">
                Receive email notifications when items fall below their low stock threshold
              </p>
            </div>
            <button
              role="switch"
              aria-checked={alertEnabled}
              onClick={() => setAlertEnabled((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                alertEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  alertEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {alertEnabled && (
            <div className="space-y-2">
              <Label htmlFor="alertEmail">Alert Email Address</Label>
              <Input
                id="alertEmail"
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                placeholder={authUser?.email || "Enter email address"}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to use your account email
              </p>
            </div>
          )}

          <Button
            onClick={handleSaveAlertPrefs}
            disabled={isSavingAlertPrefs}
          >
            {isSavingAlertPrefs ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* Update Name */}
      <div className="rounded-lg border border-border/60 p-6 bg-card">
        <h2
          className="text-lg font-medium mb-4"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}
        >
          Display Name
        </h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="name">Username</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your username"
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleUpdateName}
                disabled={isUpdatingName}
              >
                {isUpdatingName ? "Updating..." : "Update Name"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-lg border border-border/60 p-6 bg-card">
        <h2
          className="text-lg font-medium mb-4"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}
        >
          Change Password
        </h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </div>

      {/* Delete Account */}
      <div className="rounded-lg border border-destructive/60 p-6 bg-card">
        <h2
          className="text-lg font-medium mb-2 text-destructive"
          style={{ fontFamily: "var(--font-instrument), var(--font-serif)" }}
        >
          Danger Zone
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Once you delete your account, there is no going back. All your items, movements, and data will be permanently removed.
        </p>
        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <PhosphorIcon name="Trash" size={14} /> Delete Account
          </Button>
        ) : (
          <div className="flex gap-4 items-center">
            <p className="text-sm text-destructive font-medium">
              Are you sure?
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default withAuth(ProfilePage);
