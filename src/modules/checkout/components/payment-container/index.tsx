import { PaymentSession } from "@medusajs/medusa"
import Radio from "@modules/common/components/radio"
import clsx from "clsx"
import React from "react"
import PaymentStripe from "../payment-stripe"
import PaymentArabBank from "../payment-arab-bank"
import PaymentTest from "../payment-test"
import Input from "@modules/common/components/input"

type PaymentContainerProps = {
  paymentSession: PaymentSession
  selected: boolean
  setSelected: () => void
  disabled?: boolean
}

const PaymentInfoMap: Record<string, { title: string; description: string }> = {
  stripe: {
    title: "Credit card",
    description: "Secure payment with credit card",
  },
  "stripe-ideal": {
    title: "iDEAL",
    description: "Secure payment with iDEAL",
  },
  paypal: {
    title: "PayPal",
    description: "Secure payment with PayPal",
  },
  tap: {
    title: "Tap payment",
    description: "Secure payment using tap payments",
  },
  "tap-mada": {
    title: "Mada payment",
    description: "Secure payment using mada payments",
  },
  "tap-cards": {
    title: "Card payment",
    description: "Secure payment using card",
  },
  "tap-tabby": {
    title: "Tabby payment",
    description: "Secure payment using Tabby",
  },
  "tap-googlePay": {
    title: "GPay",
    description: "Secure payment using Google Pay",
  },
  "Tabby": {
    title: "tabby",
    description: "Test payment using tabby",
  },
  "Tamara": {
    title: "Tamara",
    description: "Test payment using tamara",
  },
  "arab-bank":{
    title: "Arab Bank",
    description: "Secure payment using Arab bank",
  },
  manual: {
    title: "Test payment",
    description: "Test payment using medusa-payment-manual",
  },
  "center-moroco":{
    title: "Center Moroco",
    description: "Secure payment using CMI",
  },
  "Sezzle":{
    title: "Sezzle",
    description: "Buy Now, Pay Later",
  },
  "stc":{
    title: "STC Pay",
    description: "Secure payment using STC Pay",
  },
  "noon":{
    title: "Noon Pay",
    description: "",
  }
}

const PaymentContainer: React.FC<PaymentContainerProps> = ({
  paymentSession,
  selected,
  setSelected,
  disabled = false,
}) => {
  
  return (
    <div
      className={clsx(
        "flex flex-col gap-y-4 border-b border-gray-200 last:border-b-0",
        {
          "bg-gray-50": selected,
        }
      )}
    >
      <button
        className={"grid grid-cols-[12px_1fr] gap-x-4 py-4 px-8"}
        onClick={setSelected}
        disabled={disabled}
      >
        <Radio checked={selected} />
        <div className="flex flex-col text-left">
          <h3 className="text-base-semi leading-none text-gray-900">
            {PaymentInfoMap[paymentSession.provider_id]?.title}
          </h3>
          <span className="text-gray-700 text-small-regular mt-2">
            {PaymentInfoMap[paymentSession.provider_id]?.description}
          </span>
          {selected && (
            <div className="w-full mt-4">
              <PaymentElement paymentSession={paymentSession} />
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

const CardNumber = () => {
  return (
    <div className=" border-gray-200 py-2 relative">
      
      <Input label="Card Number" name="card_number" />
    </div>
  )
}

const CardExpiry = () => {
  return (
    <div className=" border-gray-200 w-full py-2 relative">
      
      <Input label="Expiration date" name="expiration_date"/>
    </div>
  )
}

const CardCVC = () => {
  return (
    <div className=" border-gray-200 w-full py-2 relative">
      
      <Input label="CVC" name="cvc"/>
    </div>
  )
}

const PaymentElement = ({
  paymentSession,
}: {
  paymentSession: PaymentSession
}) => {
  switch (paymentSession.provider_id) {
    case "stripe":
      return (
        <div className="pt-8 pr-7">
          <PaymentStripe />
        </div>
      )
    case "manual":
      // We only display the test payment form if we are in a development environment
      return process.env.NODE_ENV === "development" ? <PaymentTest /> : null
    // case "arab-bank":
    //   return (
    //     <div className="pt-8 pr-7">
    //       <div>
    //   <div className="flex flex-col relative w-full pb-6">
    //     <CardNumber  />
    //     <div className="flex items-center mt-12 relative gap-x-4">
    //       <CardExpiry  />
    //       <CardCVC />
    //     </div>
    //   </div>
    // </div>
    //     </div>
    //   )
    default:
      return null
  }
}


export default PaymentContainer
