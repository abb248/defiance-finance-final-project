"use client";

import {
  Bell,
  EyeOff,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import CurrencySelector from "@/components/CurrencySelector";
import EmailAddressForm from "@/components/EmailAddressForm";
import ProfileNameForm from "@/components/ProfileNameForm";
import {
  THEME_CHANGED_EVENT,
  type ThemePreference,
} from "@/components/ThemeController";
import { cn, getAccountIdentifier } from "@/lib/utilsz";

type SettingsPreferences = {
  theme: "system" | "light" | "dark";
  digest: "daily" | "weekly" | "monthly";
  budgetAlerts: boolean;
  billReminders: boolean;
  transferEmails: boolean;
  assistantTips: boolean;
  hideBalances: boolean;
};

type SettingsDashboardProps = {
  user: User;
  accounts: Account[];
  currentDefaultId?: string;
};

const STORAGE_KEY = "spendwise-settings-preferences";

const DEFAULT_PREFERENCES: SettingsPreferences = {
  theme: "system",
  digest: "weekly",
  budgetAlerts: true,
  billReminders: true,
  transferEmails: true,
  assistantTips: true,
  hideBalances: false,
};

const ToggleRow = ({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
    <div className="min-w-0">
      <p className="text-14 font-semibold text-gray-900">{title}</p>
      <p className="text-12 text-gray-600">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
        checked ? "bg-blue-600" : "bg-gray-300"
      )}
    >
      <span
        className={cn(
          "absolute top-1 size-4 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  </div>
);

const SelectField = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-12 font-semibold text-gray-600">{label}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="input-class h-11 w-full px-3 text-14"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

const SettingsDashboard = ({
  user,
  accounts,
  currentDefaultId,
}: SettingsDashboardProps) => {
  const [preferences, setPreferences] =
    useState<SettingsPreferences>(DEFAULT_PREFERENCES);
  const [saveMessage, setSaveMessage] = useState("");

  const defaultAccount = useMemo(
    () =>
      accounts.find((account) => {
        const ids = [
          getAccountIdentifier(account),
          account.supabaseItemId,
          account.shareableId,
          account.id,
        ].map((id) => String(id || ""));

        return currentDefaultId ? ids.includes(String(currentDefaultId)) : false;
      }) || accounts[0],
    [accounts, currentDefaultId]
  );

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(saved) });
      }
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, []);

  const updatePreference = <Key extends keyof SettingsPreferences>(
    key: Key,
    value: SettingsPreferences[Key]
  ) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });

    if (key === "theme") {
      window.dispatchEvent(
        new CustomEvent(THEME_CHANGED_EVENT, {
          detail: value as ThemePreference,
        })
      );
    }

    setSaveMessage("");
  };

  const handleSavePreferences = () => {
    try {
      window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(preferences));
      setSaveMessage("Preferences saved on this device.");
    } catch {
      setSaveMessage("Preferences saved for this session.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Palette size={19} />
          </div>
          <div>
            <h2 className="text-18 font-semibold text-gray-900">
              App preferences
            </h2>
            <p className="text-13 text-gray-600">
              Personal display, digest, and alert choices.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex flex-col gap-2">
            <span className="text-12 font-semibold text-gray-600">
              Display currency
            </span>
            <CurrencySelector />
          </div>
          <SelectField
            label="Theme"
            value={preferences.theme}
            options={[
              { label: "System default", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            onChange={(value) =>
              updatePreference("theme", value as SettingsPreferences["theme"])
            }
          />
          <SelectField
            label="Digest"
            value={preferences.digest}
            options={[
              { label: "Daily", value: "daily" },
              { label: "Weekly", value: "weekly" },
              { label: "Monthly", value: "monthly" },
            ]}
            onChange={(value) =>
              updatePreference("digest", value as SettingsPreferences["digest"])
            }
          />
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <ToggleRow
            title="Budget alerts"
            description="Warn when a category is close to its limit."
            checked={preferences.budgetAlerts}
            onChange={(checked) => updatePreference("budgetAlerts", checked)}
          />
          <ToggleRow
            title="Bill reminders"
            description="Highlight subscriptions before they are due."
            checked={preferences.billReminders}
            onChange={(checked) => updatePreference("billReminders", checked)}
          />
          <ToggleRow
            title="Transfer emails"
            description="Show transfer confirmation preferences."
            checked={preferences.transferEmails}
            onChange={(checked) => updatePreference("transferEmails", checked)}
          />
          <ToggleRow
            title="Assistant tips"
            description="Let the assistant suggest budgets and goals."
            checked={preferences.assistantTips}
            onChange={(checked) => updatePreference("assistantTips", checked)}
          />
          <ToggleRow
            title="Hide balance preview"
            description="Mask balance totals in compact dashboard previews."
            checked={preferences.hideBalances}
            onChange={(checked) => updatePreference("hideBalances", checked)}
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="rounded-lg bg-bank-gradient px-4 py-2.5 text-14 font-semibold text-white shadow-form"
          >
            Save preferences
          </button>
          {saveMessage ? (
            <p className="text-13 font-medium text-success-700">{saveMessage}</p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <ProfileNameForm user={user} />
        <EmailAddressForm user={user} />

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <Sparkles size={19} />
            </div>
            <div>
              <h2 className="text-18 font-semibold text-gray-900">
                Assistant context
              </h2>
              <p className="text-13 text-gray-600">
                The assistant uses these preferences when answering.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <p className="text-12 font-semibold uppercase text-gray-500">
              Default receiving account
            </p>
            <p className="mt-2 text-16 font-bold text-gray-900">
              {defaultAccount?.name || "Not selected"}
            </p>
            <p className="mt-1 break-all text-12 text-gray-600">
              {defaultAccount
                ? `${defaultAccount.bankName || "Connected bank"} - ID: ${getAccountIdentifier(
                    defaultAccount
                  )}`
                : "Choose one while sending money."}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
              <LockKeyhole size={19} />
            </div>
            <div>
              <h2 className="text-18 font-semibold text-gray-900">
                Privacy controls
              </h2>
              <p className="text-13 text-gray-600">Visible account safeguards.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <Bell size={17} className="text-blue-600" />
              <p className="text-13 font-medium text-gray-700">
                Important alerts stay visible in the Alerts Center.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <EyeOff size={17} className="text-gray-700" />
              <p className="text-13 font-medium text-gray-700">
                Balance preview can be hidden in compact summaries.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <ShieldCheck size={17} className="text-success-700" />
              <p className="text-13 font-medium text-gray-700">
                Transfer checks stay active before money is sent.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <UserRound size={17} className="text-indigo-700" />
              <p className="text-13 font-medium text-gray-700">
                Profile data stays tied to the signed-in account.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsDashboard;
