import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  MapPin,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import Navbar from "@/components/wearbuy/Navbar";
import BottomNav from "@/components/wearbuy/BottomNav";
import { useWearbuy } from "@/context/wearbuy-store";
import { useAuth } from "@/context/auth-store";
import { placeOrder } from "@/lib/order.functions";
import { createCheckoutOrder, verifyPayment } from "@/lib/payment.functions";
import { useRazorpay } from "@/hooks/useRazorpay";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const { cart, removeFromCart, incQty, decQty } = useWearbuy();
  const { firebaseUser } = useAuth();
  const saveOrder = useServerFn(placeOrder);
  const createRzpOrder = useServerFn(createCheckoutOrder);
  const verifyPay = useServerFn(verifyPayment);
  const { openPayment } = useRazorpay();
  const [step, setStep] = useState<"address" | "payment" | "confirm">("address");
  const [placing, setPlacing] = useState(false);
  const [payError, setPayError] = useState("");
  const [address, setAddress] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    pincode: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "card">("cod");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const subtotal = cart.reduce((s, c) => s + c.product.priceNum * c.qty, 0);
  const deliveryFee = subtotal > 999 ? 0 : 49;
  const tryBuyFee = cart.some((c) => c.product.tryAndBuy) ? 60 : 0;
  const total = subtotal + deliveryFee + tryBuyFee;
  const eta = cart.length ? Math.max(...cart.map((c) => parseInt(c.product.deliveryEta) || 45)) : 45;

  async function handlePlaceOrder() {
    setPlacing(true);
    setPayError("");

    if (!firebaseUser || !cart.length) { setPlacing(false); return; }

    const byShop = new Map<string, typeof cart>();
    for (const c of cart) {
      const arr = byShop.get(c.product.storeId) ?? [];
      arr.push(c);
      byShop.set(c.product.storeId, arr);
    }

    for (const [shopId, items] of byShop) {
      try {
        const orderResult = await saveOrder({
          data: {
            userUid: firebaseUser.uid,
            shopId,
            paymentMethod,
            delivery: {
              name: address.name,
              phone: address.phone,
              address: [address.line1, address.line2].filter(Boolean).join(", "),
              city: address.city,
              pincode: address.pincode,
            },
            items: items.map((c) => ({
              productId: c.product.id,
              name: c.product.name,
              image: c.product.image,
              price: c.product.priceNum,
              quantity: c.qty,
              size: c.size,
            })),
            total: items.reduce((s, c) => s + c.product.priceNum * c.qty, 0),
          },
        });

        // Online payment via Razorpay
        if (paymentMethod !== "cod" && orderResult.orderId) {
          try {
            const rzpData = await createRzpOrder({ data: { uid: firebaseUser.uid, orderId: orderResult.orderId } });
            await new Promise<void>((resolve, reject) => {
              openPayment({
                keyId: rzpData.keyId,
                amount: rzpData.amount,
                currency: rzpData.currency,
                razorpayOrderId: rzpData.razorpayOrderId,
                name: "WearBuy",
                description: `Order from ${items[0].product.store}`,
                prefillName: address.name,
                prefillEmail: firebaseUser.email ?? "",
                prefillContact: address.phone,
                onSuccess: async (res) => {
                  try {
                    await verifyPay({ data: { razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature } });
                    resolve();
                  } catch (e) { reject(e); }
                },
                onFailure: (err) => reject(err),
              });
            });
          } catch (e: any) {
            setPayError(e?.reason ?? e?.message ?? "Payment failed. Retry from My Orders.");
            setPlacing(false);
            return;
          }
        }
      } catch {
        // Demo product not in DB — skip
      }
    }

    setPlacing(false);
    setOrderPlaced(true);
  }

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center animate-fadeIn">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl text-foreground mb-3">Order Placed!</h1>
          <p className="text-muted-foreground text-lg mb-2">
            Your order has been confirmed and will be delivered in ~{eta} minutes.
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            Order ID: #WB{Date.now().toString().slice(-8)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all"
            >
              Continue Shopping
            </Link>
            <Link
              to="/account"
              className="px-6 py-3 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-accent transition-all"
            >
              Track Order
            </Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-20 text-center animate-fadeIn">
          <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-muted-foreground" />
          </div>
          <h1 className="text-3xl text-foreground mb-3">Your bag is empty</h1>
          <p className="text-muted-foreground mb-8">Add items to your bag to checkout.</p>
          <Link
            to="/search"
            search={{ q: "" }}
            className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all"
          >
            Start Shopping
          </Link>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 md:pb-12">
        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to shopping
        </Link>

        <h1 className="text-3xl sm:text-4xl text-foreground mb-8">Checkout</h1>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { key: "address", label: "Address" },
            { key: "payment", label: "Payment" },
            { key: "confirm", label: "Confirm" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (s.key === "address") setStep("address");
                  if (s.key === "payment" && address.name && address.phone && address.line1 && address.city && address.pincode) setStep("payment");
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  step === s.key
                    ? "bg-primary text-primary-foreground"
                    : (s.key === "address" || (s.key === "payment" && step === "confirm"))
                    ? "bg-green-100 text-green-700"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {(s.key === "address" && step !== "address") || (s.key === "payment" && step === "confirm") ? "✓" : i + 1}
              </button>
              <span className={`text-sm hidden sm:inline ${step === s.key ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < 2 && <div className="w-8 sm:w-16 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-6">
            {step === "address" && (
              <div className="animate-fadeIn space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl text-foreground">Delivery Address</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={address.name}
                      onChange={(e) => setAddress({ ...address, name: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      value={address.line1}
                      onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                      className="sm:col-span-2 px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={address.line2}
                      onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                      className="sm:col-span-2 px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={address.pincode}
                      onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                      className="px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (address.name && address.phone && address.line1 && address.city && address.pincode) {
                      setStep("payment");
                    }
                  }}
                  disabled={!address.name || !address.phone || !address.line1 || !address.city || !address.pincode}
                  className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === "payment" && (
              <div className="animate-fadeIn space-y-6">
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl text-foreground">Payment Method</h2>
                  </div>
                  <div className="space-y-3">
                    {[
                      { id: "cod" as const, label: "Cash on Delivery", desc: "Pay when you receive your order", icon: "💵" },
                      { id: "upi" as const, label: "UPI Payment", desc: "Google Pay, PhonePe, Paytm", icon: "📱" },
                      { id: "card" as const, label: "Credit / Debit Card", desc: "Visa, Mastercard, RuPay", icon: "💳" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border bg-background hover:border-primary/30"
                        }`}
                      >
                        <span className="text-2xl">{method.icon}</span>
                        <div className="flex-1">
                          <p className="text-sm text-foreground font-medium">{method.label}</p>
                          <p className="text-xs text-muted-foreground">{method.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === method.id ? "border-primary" : "border-border"
                        }`}>
                          {paymentMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "card" && (
                    <div className="mt-5 pt-5 border-t border-border space-y-4 animate-fadeIn">
                      <input
                        type="text"
                        placeholder="Card Number"
                        className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                        <input
                          type="text"
                          placeholder="CVV"
                          className="px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Name on Card"
                        className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                  )}

                  {paymentMethod === "upi" && (
                    <div className="mt-5 pt-5 border-t border-border animate-fadeIn">
                      <input
                        type="text"
                        placeholder="Enter UPI ID (e.g. name@upi)"
                        className="w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground placeholder:text-muted-foreground/60 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("address")}
                    className="flex-1 py-3.5 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-accent transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("confirm")}
                    className="flex-[2] py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all"
                  >
                    Review Order
                  </button>
                </div>
              </div>
            )}

            {step === "confirm" && (
              <div className="animate-fadeIn space-y-6">
                {/* Address summary */}
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="text-sm text-foreground font-medium">Delivery Address</h3>
                    </div>
                    <button onClick={() => setStep("address")} className="text-xs text-primary hover:text-primary-glow link-underline">Change</button>
                  </div>
                  <p className="text-sm text-foreground">{address.name}</p>
                  <p className="text-xs text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                  <p className="text-xs text-muted-foreground">{address.city} — {address.pincode}</p>
                  <p className="text-xs text-muted-foreground">{address.phone}</p>
                </div>

                {/* Payment summary */}
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <h3 className="text-sm text-foreground font-medium">Payment</h3>
                    </div>
                    <button onClick={() => setStep("payment")} className="text-xs text-primary hover:text-primary-glow link-underline">Change</button>
                  </div>
                  <p className="text-sm text-foreground capitalize">
                    {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "upi" ? "UPI Payment" : "Credit / Debit Card"}
                  </p>
                </div>

                {/* Items summary */}
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <h3 className="text-sm text-foreground font-medium mb-4">Items ({cart.length})</h3>
                  <div className="space-y-3">
                    {cart.map((c) => (
                      <div key={c.product.id + c.size} className="flex gap-3">
                        <img src={c.product.image} alt={c.product.name} className="w-14 h-18 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{c.product.name}</p>
                          <p className="text-xs text-muted-foreground">{c.product.store} • Size {c.size} • Qty {c.qty}</p>
                          <p className="text-sm text-foreground font-medium mt-1">{c.product.price}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("payment")}
                    className="flex-1 py-3.5 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-accent transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="flex-[2] py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all disabled:opacity-50"
                  >
                    {placing ? "Placing…" : `Place Order — ₹${total.toLocaleString("en-IN")}`}
                  </button>
                  {payError && (
                    <p className="col-span-full text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-2">{payError}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="p-5 rounded-2xl bg-card border border-border">
                <h3 className="text-lg text-foreground mb-4">Order Summary</h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {cart.map((c) => (
                    <div key={c.product.id + c.size} className="flex items-center gap-3">
                      <img src={c.product.image} alt={c.product.name} className="w-12 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground truncate">{c.product.name}</p>
                        <p className="text-[11px] text-muted-foreground">Size {c.size} × {c.qty}</p>
                      </div>
                      <p className="text-xs text-foreground font-medium">₹{(c.product.priceNum * c.qty).toLocaleString("en-IN")}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className={deliveryFee === 0 ? "text-green-600 font-medium" : "text-foreground"}>
                      {deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}
                    </span>
                  </div>
                  {tryBuyFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Try & Buy fee</span>
                      <span className="text-foreground">₹{tryBuyFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-border">
                    <span className="text-foreground font-semibold">Total</span>
                    <span className="text-foreground font-semibold text-lg">₹{total.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Trust badges */}
              <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-muted-foreground">Delivery in ~{eta} min</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">100% Secure Payment</span>
                </div>
                <div className="flex items-center gap-3">
                  <Truck className="w-4 h-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Free delivery above ₹999</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
