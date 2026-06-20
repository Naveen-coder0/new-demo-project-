import { useState } from "react";
import { ShoppingBag, Store, Truck, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/context/auth-store";
import { chooseRole } from "@/lib/user.functions";

const ROLES = [
  {
    key: "USER" as const,
    title: "Customer",
    desc: "Shop fashion, track orders, save fits.",
    icon: ShoppingBag,
    redirect: "/" as const,
  },
  {
    key: "SHOP_OWNER" as const,
    title: "Shop Owner",
    desc: "Sell products, manage inventory & orders.",
    icon: Store,
    redirect: "/seller" as const,
  },
  {
    key: "DELIVERY" as const,
    title: "Delivery Partner",
    desc: "Deliver orders and earn on every trip.",
    icon: Truck,
    redirect: "/delivery" as const,
  },
];

export default function RoleSelectModal() {
  const { firebaseUser, onboarded, loading, role, refresh } = useAuth();
  const choose = useServerFn(chooseRole);
  const navigate = useNavigate();

  const [step, setStep] = useState<"role" | "details">("role");
  const [selected, setSelected] = useState<"USER" | "SHOP_OWNER" | "DELIVERY" | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  // Shop owner fields
  const [shopName, setShopName] = useState("");
  const [shopType, setShopType] = useState("");
  const [gstAvailable, setGstAvailable] = useState(false);
  const [gstNumber, setGstNumber] = useState("");
  // Delivery fields
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [license, setLicense] = useState("");

  // Only show when signed in, not yet onboarded (admins are pre-onboarded).
  if (loading || !firebaseUser || onboarded || role === "ADMIN") return null;

  function nextStep() {
    if (!selected) return;
    setStep("details");
  }

  async function submit() {
    if (!selected || !firebaseUser) return;
    setSaving(true);
    try {
      await choose({
        data: {
          firebaseUid: firebaseUser.uid,
          role: selected,
          name: `${firstName} ${lastName}`.trim() || undefined,
          phone: phone || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          pincode: pincode || undefined,
          // Shop owner
          shopName: selected === "SHOP_OWNER" ? shopName || undefined : undefined,
          shopType: selected === "SHOP_OWNER" ? shopType || undefined : undefined,
          gstAvailable: selected === "SHOP_OWNER" ? gstAvailable : undefined,
          gstNumber: selected === "SHOP_OWNER" && gstAvailable ? gstNumber || undefined : undefined,
          // Delivery
          vehicleType: selected === "DELIVERY" ? vehicleType || undefined : undefined,
          vehicleNumber: selected === "DELIVERY" ? vehicleNumber || undefined : undefined,
          aadhaar: selected === "DELIVERY" ? aadhaar || undefined : undefined,
          license: selected === "DELIVERY" ? license || undefined : undefined,
        },
      });
      await refresh();
      const target = ROLES.find((r) => r.key === selected)?.redirect ?? "/";
      navigate({ to: target });
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-xl bg-input-background border border-border text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40";

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-md overflow-y-auto">
      <div className="min-h-full flex items-start sm:items-center justify-center p-4">
        <div className="max-w-xl w-full my-4 rounded-3xl bg-background border border-border p-7 sm:p-9 shadow-2xl animate-scaleIn">

        {step === "role" && (
          <>
            <div className="text-center mb-7">
              <h1 className="text-2xl sm:text-3xl font-heading text-foreground mb-2">How will you use WearBuy?</h1>
              <p className="text-sm text-muted-foreground">Choose your role. This is permanent and cannot be changed later.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = selected === r.key;
                return (
                  <button
                    key={r.key}
                    onClick={() => setSelected(r.key)}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${
                      active ? "border-primary bg-primary/5" : "border-border bg-secondary/40 hover:border-primary/40"
                    }`}
                  >
                    {active && (
                      <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </span>
                    )}
                    <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-medium text-foreground mb-1">{r.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                  </button>
                );
              })}
            </div>

            <button
              onClick={nextStep}
              disabled={!selected}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {step === "details" && (
          <>
            <button onClick={() => setStep("role")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-xl font-heading text-foreground mb-1">
              {selected === "USER" && "Your Details"}
              {selected === "SHOP_OWNER" && "Shop Registration"}
              {selected === "DELIVERY" && "Delivery Partner Registration"}
            </h2>
            <p className="text-sm text-muted-foreground mb-5">
              {selected === "USER" && "Complete your profile to get started."}
              {selected === "SHOP_OWNER" && "Fill in your shop details. Registration fee: ₹300."}
              {selected === "DELIVERY" && "Fill in your details. Verification fee: ₹150."}
            </p>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
              {/* Common fields */}
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="First Name *" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
                <input placeholder="Last Name *" required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
              </div>
              <input placeholder="Phone Number *" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
              <input placeholder="Address *" required value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} />
              <div className="grid grid-cols-3 gap-3">
                <input placeholder="City *" required value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
                <input placeholder="State" value={state} onChange={(e) => setState(e.target.value)} className={inputCls} />
                <input placeholder="Pincode *" required value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputCls} />
              </div>

              {/* Shop Owner specific */}
              {selected === "SHOP_OWNER" && (
                <>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium text-foreground mb-2 uppercase tracking-wider">Shop Details</p>
                  </div>
                  <input placeholder="Shop Name *" required value={shopName} onChange={(e) => setShopName(e.target.value)} className={inputCls} />
                  <input placeholder="Shop Type (e.g. Streetwear, Ethnic) *" required value={shopType} onChange={(e) => setShopType(e.target.value)} className={inputCls} />
                  <label className="flex items-center gap-3 px-4 py-3 rounded-xl bg-input-background border border-border cursor-pointer">
                    <input type="checkbox" checked={gstAvailable} onChange={(e) => setGstAvailable(e.target.checked)} className="w-4 h-4 accent-primary" />
                    <span className="text-sm text-foreground">GST Available</span>
                  </label>
                  {gstAvailable && (
                    <input placeholder="GST Number *" required value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} className={inputCls} />
                  )}
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-800">Registration fee: <strong>₹300</strong>. Your shop will be reviewed and approved by our team.</p>
                  </div>
                </>
              )}

              {/* Delivery Partner specific */}
              {selected === "DELIVERY" && (
                <>
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs font-medium text-foreground mb-2 uppercase tracking-wider">Vehicle & Documents</p>
                  </div>
                  <input placeholder="Vehicle Type (Bike/Scooter/Car) *" required value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} className={inputCls} />
                  <input placeholder="Vehicle Number *" required value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} className={inputCls} />
                  <input placeholder="Aadhaar Number *" required value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} className={inputCls} />
                  <input placeholder="Driving License Number *" required value={license} onChange={(e) => setLicense(e.target.value)} className={inputCls} />
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-800">Verification fee: <strong>₹150</strong>. Your application will be reviewed and approved.</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={submit}
              disabled={
                saving ||
                !firstName ||
                !phone ||
                !pincode ||
                (selected === "SHOP_OWNER" && (!shopName || !shopType)) ||
                (selected === "DELIVERY" && (!vehicleType || !vehicleNumber || !aadhaar || !license))
              }
              className="w-full mt-5 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Setting up…" : selected === "USER" ? "Complete Profile" : "Submit & Continue"}
            </button>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
