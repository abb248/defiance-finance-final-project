'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'
import { Input } from './ui/input'
import { Button } from './ui/button'
import BankDropdown from './BankDropdown'
import { createTransfer } from '@/lib/actions/stripe.actions'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import StripeCheckout from './StripeCheckout'
import { createTransaction } from "@/lib/actions/transactions.actions";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const paymentTransferSchema = z.object({
  senderBankId: z.string().min(1, 'Please select a source bank.'),
  note: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
  shareableId: z.string().min(1, 'Please enter the shareable ID.'),
  amount: z.string().min(1, 'Please enter an amount.').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be greater than 0.'
  ),
})

type PaymentTransferFormValues = z.infer<typeof paymentTransferSchema>

interface BankAccount {
  id: string
  name: string
  currentBalance: number
  bankName?: string | null
  currencyCode?: string | null
  supabaseItemId: string
}

interface PaymentTransferFormProps {
  accounts: BankAccount[]
}

const PaymentTransferForm = ({ accounts }: PaymentTransferFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [transferAmount, setTransferAmount] = useState<number>(0)
  const [transferResult, setTransferResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [pendingTransfer, setPendingTransfer] =
    useState<TransferTransactionData | null>(null)

  const form = useForm<PaymentTransferFormValues>({
    resolver: zodResolver(paymentTransferSchema),
    defaultValues: {
      senderBankId: accounts?.[0]?.id || '',
      note: '',
      email: '',
      shareableId: '',
      amount: '',
    },
  })

  const onSubmit = async (data: PaymentTransferFormValues) => {
    setIsLoading(true)
    setTransferResult(null)

    try {
      const amount = parseFloat(data.amount)
      const memo = data.note
        ? `To: ${data.email} | Note: ${data.note}`
        : `Transfer to: ${data.email}`

      const result = await createTransfer({
        amount,
        memo,
      })

      if (result && result.client_secret) {
        setPendingTransfer({
          name: "Online Transfer",
          amount,
          senderId: data.senderBankId,
          receiverId: data.shareableId,
          email: data.email,
          note: data.note,
        })
        setClientSecret(result.client_secret)
        setTransferAmount(amount)
      } else {
        throw new Error("Failed to retrieve payment intent.")
      }
    } catch (error: any) {
      setTransferResult({
        success: false,
        message: error?.message || 'Transfer failed. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const query = new URLSearchParams(window.location.search);
      if (query.get("success")) {
        setTransferResult({
          success: true,
          message: `Transfer initiated and payment confirmed successfully!`,
        })
        form.reset()
        window.history.replaceState(null, '', '/payment-transfer')
      }
    }
  }, [form])

  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripeCheckout
          amount={transferAmount}
          onSuccess={async () => {
            if (!pendingTransfer) {
              throw new Error('Transfer details could not be found.')
            }

            const savedTransaction = await createTransaction(pendingTransfer)

            if (!savedTransaction) {
              throw new Error('Payment succeeded, but transaction history could not be updated.')
            }
          }}
          onCancel={() => {
            setClientSecret(null)
            setTransferAmount(0)
            setPendingTransfer(null)
          }}
        />
      </Elements>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">

        {transferResult && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-lg border px-4 py-3 text-14 font-medium transition-all ${transferResult.success
                ? 'border-success-100 bg-success-25 text-success-700'
                : 'border-red-200 bg-red-50 text-red-700'
              }`}
          >
            <div className={`flex size-6 shrink-0 items-center justify-center rounded-full ${transferResult.success ? 'bg-success-600' : 'bg-red-500'
              }`}>
              {transferResult.success ? (
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            {transferResult.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="senderBankId"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200 pb-6 pt-5">
              <div className="payment-transfer_form-item">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Select Source Bank
                  </FormLabel>
                  <p className="text-12 font-normal text-gray-600">
                    Select the bank account you want to transfer funds from
                  </p>
                </div>
                <div className="flex w-full flex-1 flex-col">
                  <FormControl>
                    <BankDropdown
                      accounts={accounts}
                      onChange={(id) => {
                        field.onChange(id || '')
                      }}
                    />
                  </FormControl>
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200 pb-6 pt-5">
              <div className="payment-transfer_form-item">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Transfer Note (Optional)
                  </FormLabel>
                  <p className="text-12 font-normal text-gray-600">
                    Please provide any additional information or instructions related to the transfer
                  </p>
                </div>
                <div className="flex w-full flex-1 flex-col">
                  <FormControl>
                    <textarea
                      placeholder="Write a short note here"
                      className="input-class min-h-[80px] w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-14 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...field}
                      id="transfer-note"
                    />
                  </FormControl>
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_form-details">
          <h2 className="text-18 font-semibold text-gray-900">
            Bank account details
          </h2>
          <p className="text-14 font-normal text-gray-600">
            Enter the bank account details of the recipient
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200 pb-6 pt-5">
              <div className="payment-transfer_form-item">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Recipient&apos;s Email Address
                  </FormLabel>
                </div>
                <div className="flex w-full flex-1 flex-col">
                  <FormControl>
                    <Input
                      placeholder="ex: johndoe@gmail.com"
                      className="input-class"
                      type="email"
                      {...field}
                      id="recipient-email"
                    />
                  </FormControl>
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="shareableId"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200 pb-6 pt-5">
              <div className="payment-transfer_form-item">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-bankGradient">
                    Receiver&apos;s Shareable Id
                  </FormLabel>
                </div>
                <div className="flex w-full flex-1 flex-col">
                  <FormControl>
                    <Input
                      placeholder="Enter the public account number"
                      className="input-class"
                      {...field}
                      id="receiver-shareable-id"
                    />
                  </FormControl>
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200 pb-6 pt-5">
              <div className="payment-transfer_form-item">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Amount
                  </FormLabel>
                </div>
                <div className="flex w-full flex-1 flex-col">
                  <FormControl>
                    <Input
                      placeholder="ex: 5.00"
                      className="input-class"
                      type="number"
                      step="0.01"
                      min="0.01"
                      {...field}
                      id="transfer-amount"
                    />
                  </FormControl>
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_btn-box">
          <Button
            type="submit"
            disabled={isLoading}
            className="payment-transfer_btn"
            id="transfer-funds-btn"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <svg className="size-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </div>
            ) : (
              'Transfer Funds'
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default PaymentTransferForm
