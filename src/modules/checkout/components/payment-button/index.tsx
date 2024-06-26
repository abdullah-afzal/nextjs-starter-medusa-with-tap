import { useCheckout } from "@lib/context/checkout-context"
import { PaymentSession } from "@medusajs/medusa"
import Button from "@modules/common/components/button"
import Spinner from "@modules/common/icons/spinner"
import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useCart } from "medusa-react"
import React, { useEffect, useState } from "react"

type PaymentButtonProps = {
  paymentSession?: PaymentSession | null
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ paymentSession }) => {
  const [notReady, setNotReady] = useState(true)
  const { cart } = useCart()

  useEffect(() => {
    setNotReady(true)

    if (!cart) {
      return
    }

    if (!cart.shipping_address) {
      return
    }

    if (!cart.billing_address) {
      return
    }

    if (!cart.email) {
      return
    }

    if (cart.shipping_methods.length < 1) {
      return
    }

    setNotReady(false)
  }, [cart])

  switch (paymentSession?.provider_id) {
    case "stripe":
      return (
        <StripePaymentButton session={paymentSession} notReady={notReady} />
      )
      case "arab-bank":
        return(
          <ArabBankPaymentButton session={paymentSession} notReady={notReady}/>
        )
    case "manual":
      return <ManualTestPaymentButton notReady={notReady} />
    case "paypal":
      return (
        <PayPalPaymentButton notReady={notReady} session={paymentSession} />
      )
    case "center-moroco":
      return (
        <CenterMorocoPaymentButton notReady={notReady} session={paymentSession} />
      )
      case "Tabby":
        return (
          <TabbyPaymentButton notReady={notReady} session={paymentSession} />
        )
        case "Tamara":
        return (
          <TamaraPaymentButton notReady={notReady} session={paymentSession} />
        )
    case "tap":
      return (
        <TapPaymentButton notReady={notReady} session={paymentSession} />
      )
    case "tap-mada":
      return (
        <TapMadaPaymentButton notReady={notReady} session={paymentSession} />
      )
      case "tap-cards":
      return (
        <TapCardPaymentButton notReady={notReady} session={paymentSession} />
      )
      case "tap-tabby":
      return (
        <TapTabbyPaymentButton notReady={notReady} session={paymentSession} />
      )
      case "tap-googlePay":
        return (
          <TapGPayPaymentButton notReady={notReady} session={paymentSession} />
        )
      case "Sezzle":
        return (
          <SezzlePaymentButton notReady={notReady} session={paymentSession} />
        )
      case "stc":
        return (
          <STCPaymentButton notReady={notReady} session={paymentSession} />
        )
      case "noon":
        return (
          <NoonPaymentButton notReady={notReady} session={paymentSession} />
        )
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [disabled, setDisabled] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )

  const { cart } = useCart()
  const { onPaymentCompleted } = useCheckout()

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("cardNumber")

  useEffect(() => {
    if (!stripe || !elements) {
      setDisabled(true)
    } else {
      setDisabled(false)
    }
  }, [stripe, elements])

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address.first_name +
              " " +
              cart.billing_address.last_name,
            address: {
              city: cart.billing_address.city ?? undefined,
              country: cart.billing_address.country_code ?? undefined,
              line1: cart.billing_address.address_1 ?? undefined,
              line2: cart.billing_address.address_2 ?? undefined,
              postal_code: cart.billing_address.postal_code ?? undefined,
              state: cart.billing_address.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <>
      <Button
        disabled={submitting || disabled || notReady}
        onClick={handlePayment}
      >
        {submitting ? <Spinner /> : "Checkout"}
      </Button>
      {errorMessage && (
        <div className="text-red-500 text-small-regular mt-2">
          {errorMessage}
        </div>
      )}
    </>
  )
}



const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || ""
const TAP_CLIENT_ID = process.env.NEXT_PUBLIC_TAP_CLIENT_ID || ""
const PayPalPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )

  const { cart } = useCart()
  const { onPaymentCompleted } = useCheckout()

  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    actions?.order
      ?.authorize()
      .then((authorization) => {
        if (authorization.status !== "COMPLETED") {
          setErrorMessage(`An error occurred, status: ${authorization.status}`)
          return
        }
        onPaymentCompleted()
      })
      .catch(() => {
        setErrorMessage(`An unknown error occurred, please try again.`)
      })
      .finally(() => {
        setSubmitting(false)
      })
  }
  return (
    <PayPalScriptProvider
      options={{
        "client-id": PAYPAL_CLIENT_ID,
        currency: cart?.region.currency_code.toUpperCase(),
        intent: "authorize",
      }}
    >
      {errorMessage && (
        <span className="text-rose-500 mt-4">{errorMessage}</span>
      )}
      <PayPalButtons
        style={{ layout: "horizontal" }}
        createOrder={async () => session.data.id as string}
        onApprove={handlePayment}
        disabled={notReady || submitting}
      />
    </PayPalScriptProvider>
  )
}

const TapPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  const url = session.data.transaction.url;
  return (<>
    <Button><a href={url}>Pay with Tap</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

// const ArabBankPaymentButton = ({
//   session,
//   notReady,
// }: {
//   session: PaymentSession
//   notReady: boolean
// }) => {
//   const [errorMessage, setErrorMessage] = useState<string | undefined>(
//     undefined
//   )
//   const [submitting, setSubmitting] = useState(false)

//   const { onPaymentCompleted } = useCheckout()

//   const handlePayment = () => {
//     setSubmitting(true)
    
//     onPaymentCompleted()

//     setSubmitting(false)
//   }

  
//   return (<>
//     <Button onClick={()=>console.log(session.data)}>Pay with Arabk Bank</Button>
//    <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
//    </>
//   )
// }

const ArabBankPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    console.log("it is getting called")
    onPaymentCompleted()

    setSubmitting(false)
  }

  useEffect(()=>{
    handlePayment()
    
  },[])
  

  const generateFormFields = () => {
    return Object.entries(session.data).map(([name, value]) => (
      <input key={name} id={name} type="hidden" name={name} value={value as string} />
    ));
  };

  return (
    <>
      <form id="payment_confirmation" action="https://testsecureacceptance.cybersource.com/pay" method="post">
      
{generateFormFields()}

        
        <Button type="submit" id="submit" value="Confirm">Complete Payment</Button>
      </form>
      <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
    </>
  );
};



const CenterMorocoPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }
  const generateFormFields = () => {
    return Object.entries(session.data).map(([name, value]) => (
      <input key={name} id={name} type="hidden" name={name} value={value as string} />
    ));

  };
  // console.log(session.data)
  return (<>
    <form id="payment_confirmation" action="https://testpayment.cmi.co.ma/fim/est3Dgate" method="post">

      {generateFormFields()}


      <Button type="submit" id="submit" value="Confirm">Pay with Center Moroco</Button>
    </form>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const TabbyPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  const url = session.data.configuration.available_products.installments[0].web_url;
  return (<>
    <Button><a href={url}>Pay with Tap</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const TamaraPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  var url = session.data.checkout_url || null;
  return (<>
    <Button disabled={!url}><a href={url}>Pay with Tamara</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}
const TapMadaPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  const url = session.data.transaction.url;
  return (<>
    <Button><a href={url}>Pay with Mada</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const TapGPayPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  const url = session.data.transaction.url;
  return (<>
    <Button><a href={url}>Pay with Google Pay</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const TapTabbyPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  const url = session.data.transaction.url;
  return (<>
    <Button><a href={url}>Pay with Tabby</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const TapCardPaymentButton = ({
  session,
  notReady,
}: {
  session: PaymentSession
  notReady: boolean
}) => {
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  )
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)
    
    onPaymentCompleted()

    setSubmitting(false)
  }

  const url = session.data.transaction.url;
  return (<>
    <Button><a href={url}>Pay with Card</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const SezzlePaymentButton = ({ session, notReady }: {session: PaymentSession,  notReady: boolean}) => {
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()

    setSubmitting(false)
  }
  
  //@ts-ignore
  const url = session?.data?.order?.checkout_url;

  return (
    <>
    <Button><a href={url}>Pay with Sezzle</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const STCPaymentButton = ({ session, notReady }: {session: PaymentSession,  notReady: boolean}) => {
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()

    setSubmitting(false)
  }
  
  console.log(session)

  return (
    <>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const NoonPaymentButton = ({ session, notReady }: {session: PaymentSession,  notReady: boolean}) => {
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()

    setSubmitting(false)
  }
  
  const url = session.data.result.checkoutData?.postUrl || "";

  return (
    <>
    <Button disabled={submitting || notReady}><a href={url}>{submitting ? <Spinner /> :"Pay with Noon"}</a></Button>
   <Button disabled={submitting || notReady} onClick={handlePayment}>{submitting ? <Spinner /> :"CheckOut"}</Button>
   </>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)

  const { onPaymentCompleted } = useCheckout()

  const handlePayment = () => {
    setSubmitting(true)

    onPaymentCompleted()

    setSubmitting(false)
  }

  return (
    <Button disabled={submitting || notReady} onClick={handlePayment}>
      {submitting ? <Spinner /> : "Checkout"}
    </Button>
  )
}

export default PaymentButton
