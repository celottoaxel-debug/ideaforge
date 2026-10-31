"use client";

import { useState } from "react";

type D = Record<string, string>;
const euro = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function RevenueCalc({ t, defaultPrice = 29 }: { t: D; defaultPrice?: number }) {
  const [price, setPrice] = useState(defaultPrice);
  const [visitors, setVisitors] = useState(3000);
  const [conv, setConv] = useState(2);

  const customers = Math.round(visitors * (conv / 100));
  const mrr = customers * price;
  const arr = mrr * 12;

  return (
    <div className="calc">
      <div className="calc-inputs">
        <label>{t.calc_price}<input type="number" min={0} value={price} onChange={(e) => setPrice(Math.max(0, +e.target.value || 0))} /></label>
        <label>{t.calc_visitors}<input type="number" min={0} value={visitors} onChange={(e) => setVisitors(Math.max(0, +e.target.value || 0))} /></label>
        <label>{t.calc_conv}<input type="number" min={0} max={100} step={0.1} value={conv} onChange={(e) => setConv(Math.max(0, Math.min(100, +e.target.value || 0)))} /></label>
      </div>
      <div className="calc-out">
        <div><span className="calc-k">{t.calc_customers}</span><span className="calc-v mono">{customers}</span></div>
        <div className="hot"><span className="calc-k">{t.calc_mrr}</span><span className="calc-v mono">{euro(mrr)}</span></div>
        <div><span className="calc-k">{t.calc_arr}</span><span className="calc-v mono">{euro(arr)}</span></div>
      </div>
      <p className="calc-note">{t.calc_note}</p>
    </div>
  );
}
