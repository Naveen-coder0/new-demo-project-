import { Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-12 hidden md:block">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1">
            <h3 className="text-xl text-foreground mb-2 font-medium">WearBuy</h3>
            <p className="text-sm text-muted-foreground mb-4">Your city&apos;s fashion hub. Discover, shop, and style local fashion faster.</p>
            <div className="flex gap-3">
              {[Instagram, Twitter, Facebook].map((Icon, i) => (
                <button key={i} className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <Icon className="w-4 h-4 text-foreground/85" />
                </button>
              ))}
            </div>
          </div>
          {[
            { h: "Shop", l: ["Streetwear", "Ethnic Wear", "College Fits", "Oversized"] },
            { h: "Company", l: ["About Us", "Partner Stores", "Careers", "Blog"] },
            { h: "Support", l: ["Help Center", "Track Order", "Returns", "Contact"] },
          ].map((c) => (
            <div key={c.h}>
              <h4 className="text-sm text-foreground/95 mb-4 font-medium">{c.h}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {c.l.map((x) => (
                  <li key={x}><a href="#" className="hover:text-foreground transition-colors link-underline">{x}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 WearBuy. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}