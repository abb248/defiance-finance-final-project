"use client";

import { useMemo, useState } from "react";

import BankDropdown from "@/components/BankDropdown";
import { updateDefaultReceivingAccount } from "@/lib/actions/settings.actions";
import { cn, getAccountIdentifier } from "@/lib/utilsz";

type Props = {
  accounts: Account[];
  currentDefaultId?: string;
};

const DefaultReceivingAccountSelect = ({ accounts, currentDefaultId }: Props) => {
  const initialDefault =
    currentDefaultId && accounts.some((a) => getAccountIdentifier(a) === currentDefaultId)
      ? currentDefaultId
      : getAccountIdentifier(accounts[0] || {});

  const [selectedId, setSelectedId] = useState<string>(initialDefault);
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  const defaultAccount = useMemo(
    () => accounts.find((a) => getAccountIdentifier(a) === initialDefault) || accounts[0],
    [accounts, initialDefault]
  );

  const handleSave = async () => {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await updateDefaultReceivingAccount(selectedId);
      if (!res.success) {
        setStatus({ type: "error", message: res.error || "Update failed." });
        return;
      }
      setStatus({ type: "success", message: "Default receiving account updated." });
    } catch (e: any) {
      setStatus({ type: "error", message: e?.message || "Update failed." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="min-w-0">
          <h2 className="text-18 font-semibold text-gray-900">
            Change Default Receiving Account
          </h2>
          <p className="mt-1 text-14 text-gray-600">
            Incoming transfers will be routed to your default account unless a specific receiving
            card is selected.
          </p>
        </div>

        {defaultAccount ? (
          <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-25 px-3 py-1.5 text-12 font-medium text-gray-700">
            <span className="inline-flex size-2 rounded-full bg-blue-600" aria-hidden />
            <span className="truncate">
              Current default:{" "}
              <span className="font-semibold">{defaultAccount.name || "Account"}</span>
            </span>
            <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-11 font-semibold text-blue-700">
              Default
            </span>
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <p className="mb-2 text-12 font-medium text-gray-600">Select account</p>
          <BankDropdown
            accounts={accounts as any}
            value={selectedId}
            placeholder="Select default receiving account"
            onChange={(id) => setSelectedId(id || "")}
          />

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !selectedId || selectedId === initialDefault}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center rounded-lg bg-bank-gradient px-4 py-3 text-14 font-semibold text-white shadow-form transition-opacity",
              {
                "opacity-60": isSaving || !selectedId || selectedId === initialDefault,
              }
            )}
          >
            {isSaving ? "Güncelleniyor..." : "Update default"}
          </button>

          {status ? (
            <div
              className={cn("mt-3 rounded-lg border px-4 py-3 text-14", {
                "border-success-100 bg-success-25 text-success-700": status.type === "success",
                "border-red-200 bg-red-50 text-red-700": status.type === "error",
              })}
              role="status"
            >
              {status.message}
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-3">
          <p className="mb-2 text-12 font-medium text-gray-600">Your accounts</p>
          <div className="space-y-2">
            {accounts.map((account) => {
              const id = getAccountIdentifier(account);
              const isDefault = id === initialDefault;
              const isSelected = id === selectedId;
              return (
                <div
                  key={account.id}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border bg-white px-4 py-3",
                    {
                      "border-blue-200 bg-blue-25": isSelected,
                      "border-gray-200": !isSelected,
                    }
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-14 font-semibold text-gray-900">
                      {account.name || account.bankName || "Account"}
                    </p>
                    <p className="truncate text-12 text-gray-600">
                      ID: <span className="font-medium">{id}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isDefault ? (
                      <span className="rounded-full bg-blue-600/10 px-2 py-0.5 text-11 font-semibold text-blue-700">
                        Default
                      </span>
                    ) : null}
                    <button
                      type="button"
                      className="rounded-lg border border-gray-200 px-3 py-2 text-12 font-semibold text-gray-700 hover:bg-gray-50"
                      onClick={() => setSelectedId(id)}
                    >
                      Select
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DefaultReceivingAccountSelect;

