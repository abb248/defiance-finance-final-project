"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { enroll2FA, challenge2FA, verify2FA, getMfaStatus } from "@/lib/actions/user.actions";

const getSafeQrImageSource = (value?: string) => {
  const trimmed = String(value || "").trim();
  return /^data:image\/(png|jpe?g|webp|svg\+xml);/i.test(trimmed) ? trimmed : "";
};

const TwoFactorAuth = () => {
  const [qrCode, setQrCode] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [step, setStep] = useState<"init" | "scan" | "success" | "active">("init");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      const isMfaActive = await getMfaStatus();
      if (isMfaActive) {
        setStep("active");
      }
    };
    checkStatus();
  }, []);

  const handleEnable2FA = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await enroll2FA();
      
      if (!data) {
        setError("Server returned empty response.");
        return;
      }

      // Check if server returned an error
      if (data.__error) {
        setError(`Server error: ${data.message}`);
        return;
      }

      // Try to extract QR/URI from various possible response shapes
      const uri = data.totp?.uri || data.uri;
      const qrImage = getSafeQrImageSource(data.totp?.qr_code || data.qr_code);
      const id = data.id;

      if (id && (uri || qrImage)) {
        setFactorId(id);
        setQrCode(uri || qrImage);
        setStep("scan");
      } else {
        setError(`Unexpected response format. Keys: ${Object.keys(data).join(', ')}`);
      }
    } catch (err: any) {
      console.error("handleEnable2FA error:", err);
      setError(`Client error: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter the 6-digit code completely.");
      return;
    }
    setLoading(true);
    setError("");
    try {
    
      const challengeData = await challenge2FA(factorId);
      if (!challengeData?.id) throw new Error("Verification could not be initiated.");

    
      const verifyData = await verify2FA(factorId, challengeData.id, code);
      if (verifyData) {
        setStep("success");
      } else {
        setError("Invalid code! Please enter the current code from your app.");
      }
    } catch (err) {
      setError("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck size={19} />
        </div>
        <div>
          <h2 className="text-18 font-semibold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="text-13 text-gray-600">
            Protect sign ins with an authenticator app.
          </p>
        </div>
      </div>
      
      {step === "init" && (
        <div>
          <p className="mb-4 text-14 text-gray-600">
            Secure your account against unauthorized access by linking it with Google or Microsoft Authenticator.
          </p>
          
          {error && <p className="text-14 text-red-500 font-semibold mb-4">{error}</p>}

          <button
            onClick={handleEnable2FA}
            disabled={loading}
            className="h-11 w-full rounded-lg bg-bank-gradient px-4 text-14 font-semibold text-white shadow-form disabled:opacity-60"
          >
            {loading ? "Loading..." : "Enable 2FA"}
          </button>
        </div>
      )}

      {step === "scan" && (
        <div className="flex w-full flex-col items-center">
          <p className="mb-4 text-center text-14 text-gray-600">
            Scan the QR code below with your Authenticator app.
          </p>
          
          <div className="mb-4 flex w-full justify-center rounded-lg border border-gray-200 bg-gray-25 p-5">
            {qrCode.startsWith("otpauth://") ? (
              <QRCodeSVG value={qrCode} size={256} level="M" includeMargin={true} />
            ) : qrCode ? (
              <Image
                src={qrCode}
                alt="Two-factor authentication QR code"
                width={256}
                height={256}
                unoptimized
                className="size-64 max-w-full"
              />
            ) : (
              <p className="text-14 text-red-500">QR code could not be displayed.</p>
            )}
          </div>

          {error && <p className="text-14 text-red-500 mb-4">{error}</p>}

          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} 
            placeholder="6-Digit Code"
            className="input-class mb-4 h-12 w-full px-3 text-center text-20 tracking-widest"
          />

          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="h-11 w-full rounded-lg bg-bank-gradient px-4 text-14 font-semibold text-white shadow-form disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success-50">
            <CheckCircle2 className="size-7 text-success-700" />
          </div>
          <h3 className="mb-2 text-18 font-semibold text-success-700">2FA successfully enabled</h3>
          <p className="text-14 text-gray-500">
            Your account is now protected with bank-grade security.
          </p>
        </div>
      )}

      {step === "active" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-blue-50">
            <CheckCircle2 className="size-7 text-blue-600" />
          </div>
          <h3 className="mb-2 text-18 font-semibold text-blue-700">2FA is already active</h3>
          <p className="text-14 text-gray-500">
            Your account is currently protected by Google or Microsoft Authenticator.
          </p>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
