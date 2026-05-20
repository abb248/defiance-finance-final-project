"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
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
      if (data && data.id && (data.totp?.uri || data.totp?.qr_code)) {
        setFactorId(data.id);
        setQrCode(data.totp.uri || data.totp.qr_code); 
        setStep("scan");
      } else {
        setError("Could not generate QR code. Please try again.");
      }
    } catch (err) {
      setError("An error occurred.");
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
    <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm max-w-md mx-auto mt-8">
      <h2 className="text-24 font-bold text-gray-900 mb-2">Two-Factor Authentication (2FA)</h2>
      
      {step === "init" && (
        <div className="text-center">
          <p className="text-14 text-gray-500 mb-6">
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
          
          <div className="bg-white p-4 rounded-lg mb-6 flex justify-center w-full">
            {qrCode.startsWith("otpauth://") ? (
              <QRCodeSVG value={qrCode} size={192} level="H" />
            ) : (
              <div 
                className="[&>svg]:w-48 [&>svg]:h-48 [&>svg]:max-w-full"
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h3 className="text-18 font-semibold text-green-700 mb-2">2FA Successfully Enabled!</h3>
          <p className="text-14 text-gray-500">
            Your account is now protected with bank-grade security.
          </p>
        </div>
      )}

      {step === "active" && (
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
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