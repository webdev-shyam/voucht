import { ProfileForm } from "@/components/forms/ProfileForm";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Account & Profile Settings</h1>
        <p className="text-sm text-textSecondary mt-1">
          Customize your public proof page, credentials, and notification preferences.
        </p>
      </div>

      <ProfileForm />
    </div>
  );
}
