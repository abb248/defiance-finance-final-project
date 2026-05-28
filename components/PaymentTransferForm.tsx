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
import { getRecipientAccounts } from "@/lib/actions/bank.actions";
import { createTransaction, verifyRecipient } from "@/lib/actions/transactions.actions";
import {
  SUPPORTED_TRANSFER_CURRENCIES,
  formatTransferAmount,
  getTransferLimit,
  isLargeTransferAmount,
  normalizeTransferCurrency,
  validateTransferAmount,
} from "@/lib/transfer-limits";
import { formatAmount, getAccountIdentifier } from "@/lib/utilsz";
import { ArrowLeft, CheckCircle2, Copy, ShieldAlert, Star, Trash2 } from 'lucide-react'


const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const paymentTransferSchema = z.object({
  senderBankId: z.string().min(1, 'Please select a source bank.'),
  note: z.string().max(120, 'Transfer note must be 120 characters or less.').optional(),
  email: z.string().email('Please enter a valid email address.'),
  shareableId: z.string().min(1, 'Please enter the shareable ID.'),
  amount: z.string().min(1, 'Please enter an amount.').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be greater than 0.'
  ),
  currency: z.enum(SUPPORTED_TRANSFER_CURRENCIES, {
    errorMap: () => ({ message: 'Please select a supported currency.' }),
  }),
}).superRefine((data, ctx) => {
  const amount = Number(data.amount);

  if (!Number.isFinite(amount) || amount <= 0) return;

  const transferAmountValidation = validateTransferAmount(amount, data.currency);

  if (!transferAmountValidation.allowed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amount"],
      message: transferAmountValidation.message || "Transfer amount is outside the allowed limit.",
    });
  }
})

type PaymentTransferFormValues = z.infer<typeof paymentTransferSchema>

interface BankAccount {
  id: string
  name: string
  currentBalance: number
  bankName?: string | null
  currencyCode?: string | null
  supabaseItemId: string
  shareableId?: string
}

interface PaymentTransferFormProps {
  accounts: BankAccount[]
  userEmail?: string
}

type FavoriteRecipient = {
  id: string
  email: string
  shareableId: string
  label: string
  lastUsedAt: string
}

type TransferReview = PaymentTransferFormValues & {
  amountNumber: number
  senderName: string
  receiverName: string
  referenceNumber: string
  isFavoriteRecipient: boolean
}

type TransferReceipt = {
  referenceNumber: string
  senderId: string
  senderName: string
  receiverId: string
  receiverEmail: string
  amount: number
  currency: string
  date: string
  status: string
  note?: string
  transactionId?: string
}

const getFavoriteRecipientsKey = (userEmail?: string) =>
  `defiance-favorite-recipients:${userEmail || "guest"}`

const createReferenceNumber = () =>
  `DF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`

const PaymentTransferForm = ({ accounts, userEmail }: PaymentTransferFormProps) => {
  const [isLoading, setIsLoading] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [transferAmount, setTransferAmount] = useState<number>(0)
  const [transferResult, setTransferResult] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [pendingTransfer, setPendingTransfer] =
    useState<TransferTransactionData | null>(null)
  const [recipientAccounts, setRecipientAccounts] = useState<BankAccount[]>([])
  const [loadingRecipientAccounts, setLoadingRecipientAccounts] = useState(false)
  const [favoriteRecipients, setFavoriteRecipients] = useState<FavoriteRecipient[]>([])
  const [reviewTransfer, setReviewTransfer] = useState<TransferReview | null>(null)
  const [saveAsFavorite, setSaveAsFavorite] = useState(true)
  const [largeTransferAcknowledged, setLargeTransferAcknowledged] = useState(false)
  const [transferReceipt, setTransferReceipt] = useState<TransferReceipt | null>(null)

  const form = useForm<PaymentTransferFormValues>({
    resolver: zodResolver(paymentTransferSchema),
    defaultValues: {
      senderBankId: accounts?.[0] ? getAccountIdentifier(accounts[0]) : '',
      note: '',
      email: '',
      shareableId: '',
      amount: '',
      currency: 'USD',
    },
  })

  const recipientEmail = form.watch('email')
  const senderBankId = form.watch('senderBankId')
  const selectedCurrency = form.watch('currency')
  const enteredAmount = form.watch('amount')
  const { setValue, getValues } = form
  const transferLimit = getTransferLimit(selectedCurrency)
  const enteredAmountNumber = Number(enteredAmount)
  const enteredAmountIsLarge = isLargeTransferAmount(enteredAmountNumber, selectedCurrency)
  const enteredAmountExceedsLimit =
    Number.isFinite(enteredAmountNumber) && enteredAmountNumber > transferLimit.maxAmount
  const reviewTransferIsLarge = reviewTransfer
    ? isLargeTransferAmount(reviewTransfer.amountNumber, reviewTransfer.currency)
    : false

  const findAccountName = React.useCallback(
    (accountId: string, sourceAccounts: BankAccount[] = accounts) => {
      const account = sourceAccounts.find((item) => getAccountIdentifier(item) === accountId)
      return account?.name || account?.bankName || accountId
    },
    [accounts]
  )

  const isFavoriteRecipient = React.useCallback(
    (email: string, shareableId: string) =>
      favoriteRecipients.some(
        (recipient) =>
          recipient.email.toLowerCase() === email.trim().toLowerCase() &&
          recipient.shareableId === shareableId.trim()
      ),
    [favoriteRecipients]
  )

  const persistFavoriteRecipients = React.useCallback(
    (nextRecipients: FavoriteRecipient[]) => {
      const limitedRecipients = nextRecipients.slice(0, 8)
      setFavoriteRecipients(limitedRecipients)

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          getFavoriteRecipientsKey(userEmail),
          JSON.stringify(limitedRecipients)
        )
      }
    },
    [userEmail]
  )

  React.useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const saved = window.localStorage.getItem(getFavoriteRecipientsKey(userEmail))
      setFavoriteRecipients(saved ? JSON.parse(saved) : [])
    } catch {
      setFavoriteRecipients([])
    }
  }, [userEmail])

  React.useEffect(() => {
    const fetchRecipientAccounts = async () => {
      const email = recipientEmail?.trim()

      if (!email || !z.string().email().safeParse(email).success) {
        setRecipientAccounts([])
        setValue('shareableId', '')
        return
      }

      setLoadingRecipientAccounts(true)

      try {
        const fetchedAccounts = await getRecipientAccounts({ email })
        setRecipientAccounts(fetchedAccounts)
        setValue('shareableId', '')
      } catch {
        setRecipientAccounts([])
        setValue('shareableId', '')
      } finally {
        setLoadingRecipientAccounts(false)
      }
    }

    const timer = setTimeout(fetchRecipientAccounts, 400)
    return () => clearTimeout(timer)
  }, [recipientEmail, setValue])

  React.useEffect(() => {
    if (senderBankId && getValues('shareableId') === senderBankId) {
      setValue('shareableId', '')
    }
  }, [senderBankId, getValues, setValue])

  const handleSelectFavoriteRecipient = (recipient: FavoriteRecipient) => {
    setTransferResult(null)
    setReviewTransfer(null)
    form.setValue("email", recipient.email, { shouldValidate: true })
    window.setTimeout(() => {
      form.setValue("shareableId", recipient.shareableId, { shouldValidate: true })
    }, 650)
  }

  const handleRemoveFavoriteRecipient = (recipientId: string) => {
    persistFavoriteRecipients(
      favoriteRecipients.filter((recipient) => recipient.id !== recipientId)
    )
  }

  const saveFavoriteRecipient = (transfer: TransferTransactionData) => {
    const email = transfer.email.trim()
    const shareableId = transfer.receiverId.trim()

    if (!email || !shareableId) return

    const nextFavorite: FavoriteRecipient = {
      id: `${email.toLowerCase()}-${shareableId}`,
      email,
      shareableId,
      label: email.split("@")[0] || email,
      lastUsedAt: new Date().toISOString(),
    }

    const withoutDuplicate = favoriteRecipients.filter(
      (recipient) =>
        !(
          recipient.email.toLowerCase() === email.toLowerCase() &&
          recipient.shareableId === shareableId
        )
    )

    persistFavoriteRecipients([nextFavorite, ...withoutDuplicate])
  }

  const resetTransferFlow = () => {
    setClientSecret(null)
    setTransferAmount(0)
    setPendingTransfer(null)
    setReviewTransfer(null)
    setLargeTransferAcknowledged(false)
  }

  const handleNewTransfer = () => {
    setTransferReceipt(null)
    setTransferResult(null)
    resetTransferFlow()
    form.reset({
      senderBankId: accounts?.[0] ? getAccountIdentifier(accounts[0]) : '',
      note: '',
      email: '',
      shareableId: '',
      amount: '',
      currency: 'USD',
    })
  }

  const onSubmit = async (data: PaymentTransferFormValues) => {
    setIsLoading(true)
    setTransferResult(null)
    setTransferReceipt(null)
    setReviewTransfer(null)

    try {
      if (data.senderBankId === data.shareableId) {
        setTransferResult({
          success: false,
          message: "Source and receiving accounts must be different.",
        });
        setIsLoading(false);
        return;
      }

      const amount = parseFloat(data.amount)
      const transferAmountValidation = validateTransferAmount(amount, data.currency)

      if (!transferAmountValidation.allowed) {
        setTransferResult({
          success: false,
          message: transferAmountValidation.message || "Transfer amount is outside the allowed limit.",
        })
        setIsLoading(false)
        return
      }

      const sourceAccount = accounts.find(
        (account) => getAccountIdentifier(account) === data.senderBankId
      )

      const sourceCurrency = sourceAccount?.currencyCode?.toUpperCase()

      if (
        sourceAccount &&
        (!sourceCurrency || sourceCurrency === data.currency) &&
        amount > Number(sourceAccount.currentBalance || 0)
      ) {
        setTransferResult({
          success: false,
          message: `Amount is higher than the selected account balance of ${formatTransferAmount(sourceAccount.currentBalance || 0, data.currency)}.`,
        })
        setIsLoading(false)
        return
      }

      const isMatch = await verifyRecipient(data.shareableId, data.email);
      
      if (!isMatch) {
        setTransferResult({
          success: false,
          message: "Security Alert: The provided Shareable ID and Email Address do not match our records.",
        });
        setIsLoading(false);
        return; 
      }

      const favoriteExists = isFavoriteRecipient(data.email, data.shareableId)

      setSaveAsFavorite(!favoriteExists)
      setLargeTransferAcknowledged(false)
      setReviewTransfer({
        ...data,
        amountNumber: amount,
        senderName: findAccountName(data.senderBankId),
        receiverName: findAccountName(data.shareableId, recipientAccounts),
        referenceNumber: createReferenceNumber(),
        isFavoriteRecipient: favoriteExists,
      })
    } catch (error: any) {
      setTransferResult({
        success: false,
        message: error?.message || 'Transfer failed. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmTransfer = async () => {
    if (!reviewTransfer) return

    setIsLoading(true)
    setTransferResult(null)

    try {
      const transferAmountValidation = validateTransferAmount(
        reviewTransfer.amountNumber,
        reviewTransfer.currency
      )

      if (!transferAmountValidation.allowed) {
        throw new Error(
          transferAmountValidation.message || "Transfer amount is outside the allowed limit."
        )
      }

      if (transferAmountValidation.isLarge && !largeTransferAcknowledged) {
        throw new Error("Please confirm that you reviewed this large transfer before continuing.")
      }

      const memoParts = [
        `Transfer to: ${reviewTransfer.email}`,
        `Reference: ${reviewTransfer.referenceNumber}`,
        reviewTransfer.note ? `Note: ${reviewTransfer.note}` : null,
      ].filter(Boolean)

      const result = await createTransfer({
        amount: reviewTransfer.amountNumber,
        memo: memoParts.join(" | "),
        currency: reviewTransfer.currency,
      })

      if (!result?.client_secret) {
        throw new Error("Failed to retrieve payment intent.")
      }

      setPendingTransfer({
        name: "Online Transfer",
        amount: reviewTransfer.amountNumber,
        senderId: reviewTransfer.senderBankId,
        receiverId: reviewTransfer.shareableId,
        email: reviewTransfer.email,
        note: reviewTransfer.note,
        currency: reviewTransfer.currency,
        referenceNumber: reviewTransfer.referenceNumber,
      })
      setClientSecret(result.client_secret)
      setTransferAmount(reviewTransfer.amountNumber)
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
          currency={pendingTransfer?.currency || 'USD'}
          onSuccess={async () => {
            if (!pendingTransfer) {
              throw new Error('Transfer details could not be found.')
            }

            const savedTransaction = await createTransaction(pendingTransfer)

            if (!savedTransaction) {
              throw new Error('Payment succeeded, but transaction history could not be updated.')
            }

            const receipt: TransferReceipt = {
              referenceNumber: pendingTransfer.referenceNumber || createReferenceNumber(),
              senderId: pendingTransfer.senderId,
              senderName: findAccountName(pendingTransfer.senderId),
              receiverId: pendingTransfer.receiverId,
              receiverEmail: pendingTransfer.email,
              amount: pendingTransfer.amount,
              currency: pendingTransfer.currency || 'USD',
              date: new Date().toISOString(),
              status: "Paid",
              note: pendingTransfer.note,
              transactionId: savedTransaction.id,
            }

            if (saveAsFavorite) {
              saveFavoriteRecipient(pendingTransfer)
            }

            setTransferReceipt(receipt)
            setTransferResult({
              success: true,
              message: "Transfer confirmed successfully. Your receipt is ready below.",
            })
            resetTransferFlow()
            form.reset({
              senderBankId: accounts?.[0] ? getAccountIdentifier(accounts[0]) : '',
              note: '',
              email: '',
              shareableId: '',
              amount: '',
              currency: normalizeTransferCurrency(pendingTransfer.currency),
            })
          }}
          onCancel={() => {
            resetTransferFlow()
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

        {transferReceipt && (
          <section className="mb-6 rounded-lg border border-success-100 bg-success-25 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-success-600 text-white">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <h2 className="text-18 font-semibold text-gray-900">Transfer receipt</h2>
                  <p className="text-13 text-gray-600">
                    Keep this reference number for support or reconciliation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(transferReceipt.referenceNumber)}
                className="flex items-center gap-2 rounded-lg border border-success-200 bg-white px-3 py-2 text-12 font-semibold text-success-700 hover:bg-success-50"
              >
                <Copy size={14} />
                Copy ref
              </button>
            </div>
            <div className="grid gap-3 rounded-lg bg-white p-4 text-14 sm:grid-cols-2">
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">Reference</p>
                <p className="mt-1 break-all font-semibold text-gray-900">{transferReceipt.referenceNumber}</p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">Amount</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {formatAmount(transferReceipt.amount, transferReceipt.currency)}
                </p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">From</p>
                <p className="mt-1 font-semibold text-gray-900">{transferReceipt.senderName}</p>
                <p className="break-all text-12 text-gray-500">{transferReceipt.senderId}</p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">To</p>
                <p className="mt-1 font-semibold text-gray-900">{transferReceipt.receiverEmail}</p>
                <p className="break-all text-12 text-gray-500">{transferReceipt.receiverId}</p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">Date</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(transferReceipt.date))}
                </p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">Status</p>
                <p className="mt-1 font-semibold text-success-700">{transferReceipt.status}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handleNewTransfer}
                className="rounded-lg bg-bank-gradient px-4 py-2.5 text-14 font-semibold text-white shadow-form"
              >
                New transfer
              </Button>
            </div>
          </section>
        )}

        {!transferReceipt && (
          <>
          {reviewTransfer && (
            <section className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h2 className="text-18 font-semibold text-gray-900">Review transfer</h2>
                <p className="text-13 text-gray-600">
                  Confirm the recipient and amount before opening secure checkout.
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-lg bg-white p-4 text-14 sm:grid-cols-2">
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">Sending</p>
                <p className="mt-1 text-20 font-bold text-gray-900">
                  {formatAmount(reviewTransfer.amountNumber, reviewTransfer.currency)}
                </p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">Reference</p>
                <p className="mt-1 break-all font-semibold text-gray-900">{reviewTransfer.referenceNumber}</p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">From</p>
                <p className="mt-1 font-semibold text-gray-900">{reviewTransfer.senderName}</p>
                <p className="break-all text-12 text-gray-500">{reviewTransfer.senderBankId}</p>
              </div>
              <div>
                <p className="text-12 font-semibold uppercase text-gray-500">To</p>
                <p className="mt-1 font-semibold text-gray-900">{reviewTransfer.email}</p>
                <p className="break-all text-12 text-gray-500">{reviewTransfer.shareableId}</p>
              </div>
            </div>
            {reviewTransferIsLarge && (
              <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-13 text-amber-900">
                <input
                  type="checkbox"
                  checked={largeTransferAcknowledged}
                  onChange={(event) => setLargeTransferAcknowledged(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  This is a large transfer. I reviewed the recipient, amount, currency, and reference number before continuing.
                </span>
              </label>
            )}
            {!reviewTransfer.isFavoriteRecipient && (
              <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-13 text-amber-800">
                <input
                  type="checkbox"
                  checked={saveAsFavorite}
                  onChange={(event) => setSaveAsFavorite(event.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  This is not in your favorites yet. Save this recipient after a successful transfer.
                </span>
              </label>
            )}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setReviewTransfer(null)}
                className="w-full gap-2"
              >
                <ArrowLeft size={16} />
                Edit details
              </Button>
              <Button
                type="button"
                disabled={isLoading || (reviewTransferIsLarge && !largeTransferAcknowledged)}
                onClick={handleConfirmTransfer}
                className="payment-transfer_btn w-full"
              >
                {isLoading ? "Preparing checkout..." : "Confirm and continue"}
              </Button>
            </div>
            </section>
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
                      value={field.value}
                      placeholder="Select source account"
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

        {favoriteRecipients.length > 0 && (
          <section className="border-t border-gray-200 pb-6 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Star size={17} className="fill-amber-400 text-amber-500" />
              <h3 className="text-14 font-semibold text-gray-900">Favorite recipients</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {favoriteRecipients.map((recipient) => (
                <div
                  key={recipient.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectFavoriteRecipient(recipient)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-13 font-semibold text-gray-900">{recipient.label}</p>
                    <p className="truncate text-12 text-gray-500">{recipient.email}</p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${recipient.label} from favorites`}
                    onClick={() => handleRemoveFavoriteRecipient(recipient.id)}
                    className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
                <div className="flex w-full flex-1 flex-col gap-2">
                  <FormControl>
                    <Input
                      placeholder="ex: johndoe@gmail.com"
                      className="input-class"
                      type="email"
                      {...field}
                      id="recipient-email"
                    />
                  </FormControl>
                  {userEmail ? (
                    <button
                      type="button"
                      className="w-fit text-12 font-medium text-blue-600 hover:underline"
                      onClick={() => {
                        form.setValue("email", userEmail, { shouldValidate: true });
                      }}
                    >
                      Use my email ({userEmail})
                    </button>
                  ) : null}
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
                    Receiving Account
                  </FormLabel>
                  <p className="text-12 font-normal text-gray-600">
                    Choose which account should receive the funds
                  </p>
                </div>
                <div className="flex w-full flex-1 flex-col gap-2">
                  {loadingRecipientAccounts ? (
                    <p className="text-14 text-gray-500">Loading accounts...</p>
                  ) : recipientAccounts.length > 0 ? (
                    <>
                      <FormControl>
                        <BankDropdown
                          accounts={recipientAccounts}
                          value={field.value}
                          excludeAccountIds={senderBankId ? [senderBankId] : []}
                          placeholder="Select receiving account"
                          onChange={(id) => field.onChange(id || "")}
                        />
                      </FormControl>
                      {field.value ? (
                        <p className="text-12 text-gray-500">
                          Shareable ID: <span className="font-medium">{field.value}</span>
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <FormControl>
                        <Input
                          placeholder="Enter the public account number"
                          className="input-class"
                          {...field}
                          id="receiver-shareable-id"
                        />
                      </FormControl>
                      {recipientEmail && z.string().email().safeParse(recipientEmail).success ? (
                        <p className="text-12 text-gray-500">
                          No accounts found for this email. Enter the shareable ID manually.
                        </p>
                      ) : null}
                    </>
                  )}
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200 pb-6 pt-5">
              <div className="payment-transfer_form-item">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Currency
                  </FormLabel>
                </div>
                <div className="flex w-full flex-1 flex-col">
                  <FormControl>
                    <select
                      className="input-class bg-white border border-gray-300 text-gray-900 rounded-lg py-2.5 px-4 focus:ring-blue-500 focus:border-blue-500 block w-full"
                      {...field}
                      id="transfer-currency"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="TRY">TRY - Turkish Lira</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="CAD">CAD - Canadian Dollar</option>
                    </select>
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
                      max={transferLimit.maxAmount}
                      {...field}
                      id="transfer-amount"
                    />
                  </FormControl>
                  <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-12 text-gray-600">
                    <p>
                      Single transfer limit:{" "}
                      <span className="font-semibold text-gray-800">
                        {formatTransferAmount(transferLimit.maxAmount, transferLimit.currency)}
                      </span>
                    </p>
                    <p>
                      Large transfer review starts at{" "}
                      <span className="font-semibold text-gray-800">
                        {formatTransferAmount(transferLimit.warningAmount, transferLimit.currency)}
                      </span>
                      .
                    </p>
                  </div>
                  {enteredAmountIsLarge && (
                    <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-12 font-medium text-amber-800">
                      This amount will require one extra confirmation on the review step.
                    </div>
                  )}
                  {enteredAmountExceedsLimit && (
                    <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-12 font-medium text-red-700">
                      This is above the single transfer limit for {transferLimit.currency}.
                    </div>
                  )}
                  <FormMessage className="form-message mt-2" />
                </div>
              </div>
            </FormItem>
          )}
        />

          <div className="payment-transfer_btn-box">
            <Button
              type="submit"
              disabled={isLoading || enteredAmountExceedsLimit}
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
              ) : enteredAmountExceedsLimit ? (
                'Lower amount to continue'
              ) : (
                'Review Transfer'
              )}
            </Button>
          </div>
          </>
        )}
      </form>
    </Form>
  )
}

export default PaymentTransferForm
