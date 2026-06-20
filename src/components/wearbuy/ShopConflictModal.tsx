import { AlertTriangle } from "lucide-react";
import { useWearbuy } from "@/context/wearbuy-store";

export default function ShopConflictModal() {
  const { shopConflict, confirmShopSwitch, cancelShopSwitch } = useWearbuy();
  if (!shopConflict) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={cancelShopSwitch}>
      <div
        className="max-w-sm w-full rounded-3xl bg-background border border-border p-7 text-center shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <AlertTriangle className="w-7 h-7 text-amber-600" />
        </div>
        <h3 className="text-lg font-heading text-foreground mb-2">Replace cart items?</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Your cart currently contains items from another shop. Adding this item will remove all existing items from
          your cart. Do you want to continue?
        </p>
        <div className="flex gap-3">
          <button
            onClick={cancelShopSwitch}
            className="flex-1 py-3 rounded-xl bg-secondary border border-border text-foreground font-medium hover:bg-accent transition-all"
          >
            Cancel
          </button>
          <button
            onClick={confirmShopSwitch}
            className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-glow transition-all"
          >
            Clear Cart & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
