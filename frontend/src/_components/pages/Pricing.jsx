import React from "react";
import { Check } from "lucide-react";

const PLANS = [
  {
    name: "Basic",
    price: "$0",
    period: "/month",
    features: ["AI chat recipe suggestions", "Recipe gallery access", "Save up to 5 favorites"],
    highlight: false,
  },
  {
    name: "Plus",
    price: "$4.99",
    period: "/month",
    features: [
      "Everything in Basic",
      "Unlimited favorites",
      "Weekly meal planner",
      "Shopping list generator",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/month",
    features: [
      "Everything in Plus",
      "Personalized AI nutrition profile",
      "Fridge clean-out mode",
      "Priority AI response",
    ],
    highlight: true,
  },
  {
    name: "Family",
    price: "$14.99",
    period: "/month",
    features: ["Everything in Pro", "Up to 5 family members", "Shared meal plans", "Shared shopping list"],
    highlight: false,
  },
];

const Pricing = () => {
  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-light tracking-tight mb-3">Pricing</h1>
          <p className="text-gray-400 text-sm">Chọn gói phù hợp với nhu cầu ăn uống của bạn.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`p-8 rounded-2xl border flex flex-col ${
                plan.highlight ? "border-black shadow-lg scale-[1.02]" : "border-gray-100"
              }`}
            >
              {plan.highlight && (
                <span className="text-[10px] uppercase tracking-widest font-bold text-white bg-black rounded-full px-3 py-1 w-fit mb-4">
                  Popular
                </span>
              )}
              <h2 className="text-lg font-semibold mb-1">{plan.name}</h2>
              <p className="mb-6">
                <span className="text-3xl font-light">{plan.price}</span>
                <span className="text-gray-400 text-sm">{plan.period}</span>
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-black shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className={`w-full py-3 rounded-xl text-sm font-semibold cursor-not-allowed ${
                  plan.highlight ? "bg-black text-white opacity-60" : "border border-gray-200 text-gray-400"
                }`}
              >
                Coming soon
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
