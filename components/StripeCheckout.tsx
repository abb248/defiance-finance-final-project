'use client'

import React, { useState } from 'react'
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { Button } from './ui/button'

type StripeCheckoutProps = {
  amount: number
  currency: string
  onCancel: () => void
  onSuccess: () => Promise<void>
}

const StripeCheckout = ({ amount, currency, onCancel, onSuccess }: StripeCheckoutProps) => {
  const stripe = useStripe()
  const elements = useElements()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: window.location.origin + '/payment-transfer?success=true',
      },
    })

    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred.')
      setIsLoading(false)
      return
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      try {
        await onSuccess()
      } catch (saveError: any) {
        setErrorMessage(saveError?.message || 'Payment succeeded, but transaction history could not be updated.')
        setIsLoading(false)
        return
      }

      return
    }

    setErrorMessage('Payment could not be completed. Please try again.')
    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-[850px] flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-200 pb-4">
        <h2 className="text-18 font-semibold text-gray-900">Secure Checkout</h2>
        <p className="text-14 text-gray-600">
          Enter your card details to complete the transfer of {currency} {amount.toFixed(2)}
        </p>
      </div>

      <PaymentElement id="payment-element" />

      {errorMessage && (
        <div className="text-14 font-medium text-red-600">
          {errorMessage}
        </div>
      )}

      <div className="flex w-full gap-3 pt-4">
        <Button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          variant="outline"
          className="w-full"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || !stripe || !elements}
          className="payment-transfer_btn"
        >
          {isLoading ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  )
}

export default StripeCheckout
