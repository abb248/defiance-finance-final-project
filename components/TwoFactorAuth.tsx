"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { enroll2FA, challenge2FA, verify2FA, getMfaStatus } from "@/lib/actions/user.actions";

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
      console.log("enroll2FA response:", JSON.stringify(data, null, 2));
      
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
      const uri = data.totp?.uri || data.uri || data.totp?.qr_code || data.qr_code;
      const id = data.id;

      if (id && uri) {
        setFactorId(id);
        setQrCode(uri); 
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
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <ShieldCheck size={19} />
        </div>
        <div>
          <h2 className="text-18 font-semibold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="text-13 text-gray-600">
            Protect sign-ins with an authenticator app.
          </p>
        </div>
      </div>
      
      {step === "init" && (
        <div>
          <p className="mb-6 text-14 text-gray-600">
            Secure your account against unauthorized access by linking it with Google or Microsoft Authenticator.
          </p>
          
          {error && <p className="text-14 text-red-500 font-semibold mb-4">{error}</p>}

          <button
            onClick={handleEnable2FA}
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-all disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Enable 2FA"}
          </button>
        </div>
      )}

      {step === "scan" && (
        <div className="flex flex-col items-center w-full">
          <p className="text-14 text-gray-600 text-center mb-4">
            Scan the QR code below with your Authenticator app.
          </p>
          
          <div className="bg-white p-6 rounded-xl mb-6 flex justify-center w-full border border-gray-100 shadow-sm">
            {qrCode.startsWith("otpauth://") ? (
              <QRCodeSVG value={qrCode} size={256} level="M" includeMargin={true} />
            ) : (
              <div 
                className="[&>svg]:w-64 [&>svg]:h-64 [&>svg]:max-w-full"
                dangerouslySetInnerHTML={{ __html: qrCode.replace(/^data:image\/svg\+xml;utf-8,/, '') }} 
              />
            )}
          </div>

          {error && <p className="text-14 text-red-500 mb-4">{error}</p>}

          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} 
            placeholder="6-Digit Code"
            className="w-full border border-gray-300 rounded-lg p-3 text-center text-20 tracking-widest mb-4 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />

          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-all disabled:bg-blue-300"
          >
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </div>
      )}

      {step === "success" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="size-8 text-green-600" />
          </div>
          <h3 className="text-18 font-semibold text-green-700 mb-2">2FA Successfully Enabled!</h3>
          <p className="text-14 text-gray-500">
            Your account is now protected with bank-grade security.
          </p>
        </div>
      )}

      {step === "active" && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-blue-100">
            <CheckCircle2 className="size-8 text-blue-600" />
          </div>
          <h3 className="text-18 font-semibold text-blue-700 mb-2">2FA is Already Active</h3>
          <p className="text-14 text-gray-500">
            Your account is currently protected by Google or Microsoft Authenticator.
          </p>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;
