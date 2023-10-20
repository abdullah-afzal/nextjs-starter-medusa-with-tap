import { useState, useEffect } from "react";
import Button from "@modules/common/components/button";
import Input from "@modules/common/components/input";
import Spinner from "@modules/common/icons/spinner";
import axios from 'axios';
import { useRouter } from "next/navigation"
import { useAccount } from "@lib/context/account-context";
import { medusaClient } from "@lib/config"

const PhoneLogin = () => {
  const [recipientNumber, setRecipientNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const router = useRouter();
  const { refetchCustomer } = useAccount()

  const handleSendOTP = async () => {
    // Validate the phone number
    if (!recipientNumber) {
      alert('Please enter a valid phone number.');
      return;
    }

    // Show a loading spinner
    setIsSubmitting(true);

    try {
      // Send a request to your server to send an OTP to the provided phone number
      const response = await axios.post('http://localhost:9000/store/auth/sendotp', {
        recipientNumber: recipientNumber,
      });

      if (response.status === 200) {
        setIsOtpSent(true);
      } else {
        alert('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
    } finally {
      setIsSubmitting(false);
    }

    // Start the countdown
    setCountdown(30);
  };
  const [authError, setAuthError] = useState<string | undefined>(undefined)
  const handleError = (_e: Error) => {
    setAuthError("Invalid email or password")
  }
  const handleVerify = async ()=>{
    await medusaClient.auth
      .authenticate({
              whatsapp:true,
              recipientNumber: recipientNumber,
              otp: otp,
            })
      .then(() => {
        refetchCustomer()
        router.push("/account")
      })
      .catch(handleError)
  }
  // const handleVerify = async () => {
  //   if (!otp) {
  //     alert('Please enter a valid OTP.');
  //     return;
  //   }

  //   // Show a loading spinner
  //   setIsSubmitting(true);

  //   try {
  //     // Send a request to your server to verify the OTP
  //     const response = await axios.post('http://localhost:9000/store/auth/matchotp', {
  //       recipientNumber: recipientNumber,
  //       otp: otp,
  //     });
      

  //     if (response.status !== 401) {
  //       // const sid = await axios.post('http://localhost:9000/store/whatsappauth/createSession', {
  //       //   customer_id: response.data.customer.id
  //       // });
  //       // const date = new Date();
  //       // date.setTime(date.getTime() + (1 * 24 * 60 * 60 * 1000));
  //       // const expires = `expires=${date.toUTCString()}`;
  //       // document.cookie = `connect.sid=${sid.data.sid}`
  //       // console.log(sid.data.sid)
  //       // console.log(expires)
  //       // console.log(document.cookie);
  //       router.push('/account');
  //     } else {
  //       alert('Failed to verify OTP. Please try again.');
  //     }
  //   } catch (error) {
  //     console.error('Error verifying OTP:', error);
  //   } finally {
  //     setIsSubmitting(false);
  //   }

  //   // Clear the countdown
  //   setCountdown(0);
  // };

  useEffect(() => {
    if (isOtpSent && countdown > 0) {
      const countdownInterval = setInterval(() => {
        setCountdown((prevCountdown) => prevCountdown - 1);
      }, 1000);

      return () => {
        clearInterval(countdownInterval);
      };
    } else if (countdown === 0) {
      // Automatically switch back to "Send OTP" phase when countdown reaches zero
      setIsOtpSent(false);
    }
  }, [isOtpSent, countdown]);

  return (
    <div className="max-w-sm w-full flex flex-col items-center">
      {isSubmitting && (
        <div className="z-10 fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <Spinner size={24} />
        </div>
      )}
      <h1 className="text-large-semi uppercase mb-6">
        {isOtpSent ? "Verify OTP" : "Enter your Phone Number"}
      </h1>
      <p className="text-center text-base-regular text-gray-700 mb-8">
        {isOtpSent
          ? `Enter the OTP sent to your phone number.`
          : "We'll send you an OTP to verify your phone number."}
      </p>
      <div className="w-full">
        {isOtpSent ? (
          <Input
            label="OTP"
            type="text"
            placeholder="Enter the OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        ) : (
          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter your phone number"
            value={recipientNumber}
            onChange={(e) => setRecipientNumber(e.target.value)}
          />
        )}
      </div>
      <Button className="mt-6" onClick={isOtpSent ? handleVerify : handleSendOTP}>
        {isOtpSent ? "Verify" : "Send OTP"}
      </Button>
      <Button
        className="mt-6"
        style={{ display: isOtpSent ? "block" : "none" }}
        disabled={isOtpSent && countdown > 0}
      >
        {`Resend in ${countdown}`}
      </Button>
    </div>
  );
};

export default PhoneLogin;
