'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, signUp, challenge2FA, verify2FA } from '@/lib/actions/user.actions';

import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import CustomInput from './CustomInput';
import { authFormSchema } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Loader2 } from "lucide-react"
const AuthForm = ({ type }: { type: 'sign-in' | 'sign-up' }) => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  
  // 2FA state
  const [showMfa, setShowMfa] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const formSchema = authFormSchema(type);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      address: '',
      state: '',
     postalCode: '',
     dateOfBirth: '',
     ssn: '',
    },
  });
// components/AuthForm.tsx içindeki onSubmit fonksiyonu

const onSubmit = async (data: z.infer<typeof formSchema>) => {
  setIsLoading(true);
  setFormError(null);

  try {
    if (type === 'sign-up') {
      // 1. Supabase kayıt fonksiyonumuzu çağırıyoruz
      const result = await signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName!, // Formdan gelen veriler
        lastName: data.lastName!,
        address: data.address!,
        state: data.state!,
        postalCode: data.postalCode!,
        dateOfBirth: data.dateOfBirth!,
        ssn: data.ssn!,
      });

      // 2. Başarılı olursa kullanıcıyı duruma (state) kaydediyoruz
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.user) {
        setUser(result.user as any);
      } else {
        setFormError('Sign-up failed. Please try again.');
      }
    }

    if (type === 'sign-in') {
      // 1. Supabase giriş fonksiyonumuzu çağırıyoruz
      const result = await signIn({
        email: data.email,
        password: data.password,
      });

      // 2. Başarılı giriş olursa ana sayfaya yönlendiriyoruz
      if (result?.error) {
        setFormError(result.error);
      } else if (result?.requiresMfa && result?.factorId) {
        setShowMfa(true);
        setFactorId(result.factorId);
      } else if (result?.user) {
        router.push('/');
      } else {
        setFormError('Sign-in failed. Please try again.');
      }
    }
  } catch (error) {
    console.log("Error submitting form:", error);
    setFormError('An unexpected error occurred. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

const handleMfaSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (mfaCode.length !== 6) {
    setFormError('Please enter the 6-digit code completely.');
    return;
  }
  
  setIsLoading(true);
  setFormError(null);
  try {
    const challenge = await challenge2FA(factorId);
    if (!challenge?.id) throw new Error("Verification could not be initiated.");
    
    const verify = await verify2FA(factorId, challenge.id, mfaCode);
    if (verify) {
      router.push('/');
    } else {
      setFormError("Invalid code! Please enter the current code from your app.");
    }
  } catch (err) {
    setFormError("Verification failed.");
  } finally {
    setIsLoading(false);
  }
};
 

  return (
    <section className="relative z-10 w-full flex flex-col justify-center gap-8 rounded-[30px] border border-white/20 bg-white/10 p-10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] transition-all">
      <header className="flex flex-col gap-5 md:gap-8">
        <Link href="/" className="cursor-pointer flex items-center gap-1">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Defiance Finance logo"
          />
          <h1 className="text-26 font-ibm-plex-serif font-bold text-white drop-shadow-md">
            Defiance Finance
          </h1>
        </Link>

        <div className="flex flex-col gap-1 md:gap-3">
          <h1 className="text-24 lg:text-36 font-semibold text-white">
            {user
              ? 'Link Account'
              : type === 'sign-in'
              ? 'Sign In'
              : 'Sign Up'}
          </h1>

          <p className="text-16 font-normal text-white/80">
            {user
              ? 'Link your account to get started'
              : 'Please enter your details'}
          </p>
        </div>
      </header>

      {showMfa ? (
        <form onSubmit={handleMfaSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
             <h2 className="text-18 font-semibold text-white">Two-Factor Authentication</h2>
             <p className="text-14 text-gray-300">Please enter the 6-digit code from your Authenticator app.</p>
          </div>
          
          <input
            type="text"
            maxLength={6}
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            placeholder="6-Digit Code"
            className="w-full border border-gray-300 rounded-lg p-3 text-center text-20 tracking-widest focus:ring-2 focus:ring-green-600 focus:outline-none text-black"
          />
          
          <Button type="submit" disabled={isLoading || mfaCode.length !== 6} className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] duration-300 w-full rounded-xl py-6 text-lg">
            {isLoading ? "Verifying..." : "Verify Code"}
          </Button>
          
          {formError && <p className="text-sm text-red-600">{formError}</p>}
        </form>
      ) : user ? (
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-500/20">
            <svg width="32" height="32" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-22 font-bold text-white">Account Created!</h2>
          <p className="text-14 text-white/70">Your account has been created successfully. Redirecting you to sign in...</p>
          <Button
            type="button"
            onClick={() => router.push('/sign-in')}
            className="mt-2 w-full rounded-xl py-4 text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold"
          >
            Go to Sign In
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, () => {
              setFormError('Please correct the errors in the form.');
            })}
            className="space-y-6 [&_input]:bg-white/5 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder:text-white/50 [&_label]:text-white/90 [&_input]:backdrop-blur-sm [&_input]:focus:border-purple-400 [&_input]:transition-all"
          >
            {type === 'sign-up' && (
              <div className="flex gap-4">
                <CustomInput
                  control={form.control}
                  name="firstName"
                  label="First Name"
                  placeholder="ex: John"
                />
                <CustomInput
                  control={form.control}
                  name="lastName"
                  label="Last Name"
                  placeholder="ex: Doe"
                />
              </div>
            )}

            <CustomInput
              control={form.control}
              name="email"
              label="Email"
              placeholder="Enter your email"
            />

            <CustomInput
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
            />
            {type === 'sign-up' && (
              <>
            <CustomInput
        control={form.control}
        name="address"
        label="Address"
        placeholder="Enter your specific address"
      />
            <CustomInput
              control={form.control}
              name="state"
              label="State/City"
              placeholder="ex: NY"
            />
        <CustomInput
          control={form.control}
          name="ssn"
          label="SSN"
          placeholder="ex: 1234"
        />
        <CustomInput
          control={form.control}
          name="dateOfBirth"
          label="Date of Birth"
          placeholder="YYYY-MM-DD"
        />
        <CustomInput
          control={form.control}
          name="postalCode"
          label="Postal Code"
          placeholder="ex: 11101"
        />
              </>
            )}
        
           <Button
  type="submit"
  disabled={isLoading}
  className="w-full rounded-xl py-6 text-lg bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white font-semibold shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-[1.02] duration-300"
>
  {isLoading ? (
    <>
      <Loader2 size={20} className="animate-spin" />
      {" "}Loading...
    </>
  ) : type === 'sign-in' ? (
    'Sign In'
  ) : (
    'Sign Up'
  )}
</Button>

            {formError ? (
              <p className="text-sm text-red-600">{formError}</p>
            ) : null}
          </form>
        </Form>
        
      )}
      <footer className="flex justify-center gap-1 mt-4">
  <p className="text-14 font-normal text-white/80">
    {type === 'sign-in'
      ? "Don't have an account?"
      : "Already have an account?"}
  </p>

  <Link
    href={type === 'sign-in' ? '/sign-up' : '/sign-in'}
    className="form-link text-white font-bold hover:text-purple-300 transition-colors"
  >
    {type === 'sign-in' ? 'Sign Up' : 'Sign In'}
  </Link>
</footer>
    </section>
  );
};

export default AuthForm;
