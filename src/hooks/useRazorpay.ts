import { useCallback, useRef } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

type RazorpayOptions = {
  keyId: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  name?: string;
  description?: string;
  prefillName?: string;
  prefillEmail?: string;
  prefillContact?: string;
  onSuccess: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  onFailure: (error: any) => void;
};

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Hook to open Razorpay checkout modal.
 * Loads the Razorpay SDK on demand and opens payment.
 */
export function useRazorpay() {
  const loadedRef = useRef(false);

  const openPayment = useCallback(async (options: RazorpayOptions) => {
    if (!loadedRef.current) {
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok) {
        options.onFailure(new Error("Failed to load Razorpay SDK"));
        return;
      }
      loadedRef.current = true;
    }

    const rzp = new window.Razorpay({
      key: options.keyId,
      amount: options.amount,
      currency: options.currency,
      order_id: options.razorpayOrderId,
      name: options.name ?? "WearBuy",
      description: options.description ?? "Order Payment",
      prefill: {
        name: options.prefillName ?? "",
        email: options.prefillEmail ?? "",
        contact: options.prefillContact ?? "",
      },
      theme: {
        color: "#3d2c1e", // matches our primary
      },
      handler: (response: any) => {
        options.onSuccess({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        });
      },
      modal: {
        ondismiss: () => {
          options.onFailure({ reason: "Payment cancelled by user" });
        },
      },
    });

    rzp.on("payment.failed", (response: any) => {
      options.onFailure(response.error);
    });

    rzp.open();
  }, []);

  return { openPayment };
}
