import { TrendingUp, Users, Store, Zap } from "lucide-react";

const stats = [
  { icon: Store, value: "320+", label: "Stores open now" },
  { icon: Users, value: "1.2k+", label: "Shopping right now" },
  { icon: Zap, value: "38 min", label: "Avg delivery" },
  { icon: TrendingUp, value: "850+", label: "Orders today" },
];

export default function LiveStats() {
  return (
    <section className="py-8 sm:py-10 border-y border-border/30">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 animate-stagger">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="flex items-center gap-3 p-4 sm:p-5 rounded-2xl bg-card/80 border border-border/40 hover:border-primary/30 hover-lift transition-all"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl text-foreground font-medium">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}