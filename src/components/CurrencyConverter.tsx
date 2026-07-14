"use client";
import { useState } from "react";
import { NoticeBox } from "./NoticeBox";
import { convertCurrency } from "@/lib/currency";
import { useCurrency } from "@/lib/useCurrency";
import type { CurrencyDirection } from "@/types/currency";

const quickAmounts = [1000, 3000, 5000, 10000, 30000];
const jpyFormatter = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 0 });
const twdFormatter = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 1 });
const keypad = ["7", "8", "9", "clear", "4", "5", "6", "backspace", "1", "2", "3", "00", "0", ".", "000"] as const;

export function CurrencyConverter() {
  const currency = useCurrency();
  const [direction, setDirection] = useState<CurrencyDirection>("JPY_TWD");
  const [amount, setAmount] = useState("1000");
  const source = direction === "JPY_TWD" ? "JPY" : "TWD";
  const target = direction === "JPY_TWD" ? "TWD" : "JPY";
  const numericAmount = Number(amount);
  const result = currency.status === "success" ? convertCurrency(numericAmount, currency.data.rate, direction) : null;
  const resultText = currency.status === "loading"
    ? "匯率載入中"
    : result === null
      ? "暫時無法換算"
      : direction === "JPY_TWD"
        ? `NT$ ${twdFormatter.format(result)}`
        : `¥ ${jpyFormatter.format(result)}`;

  function switchDirection() {
    setDirection((value) => value === "JPY_TWD" ? "TWD_JPY" : "JPY_TWD");
    setAmount(result === null ? "" : String(Math.round(result * 10) / 10));
  }

  function append(value: string) {
    setAmount((current) => {
      if (value === "." && current.includes(".")) return current;
      if (current.length >= 12) return current;
      if (!current || current === "0") return value === "." ? "0." : value.startsWith("0") ? "0" : value;
      return `${current}${value}`;
    });
  }

  function handleInput(value: string) {
    if (/^\d{0,9}(\.\d{0,2})?$/.test(value)) setAmount(value);
  }

  return <>
    {currency.status === "error"&&<NoticeBox title="暫時無法取得最新匯率">{currency.error}，沒有可用的上次資料。</NoticeBox>}
    {currency.status === "success"&&currency.data.stale&&<NoticeBox tone="blue" title="使用上次參考匯率">匯率服務暫時無法連線，換算仍可使用最近一次成功取得的資料。</NoticeBox>}
    <section className="currency-sheet" aria-label="匯率換算計算機">
      <div className="currency-direction"><span>{source}</span><button type="button" onClick={switchDirection} aria-label="切換換算方向">⇄</button><span>{target}</span></div>
      <label className="currency-input"><span>輸入金額 · {source}</span><input type="text" inputMode="decimal" value={amount} onChange={(event)=>handleInput(event.target.value)} placeholder="0" aria-label={`${source} 金額`}/></label>
      <div className="currency-result" aria-live="polite"><span>約為 · {target}</span><strong>{resultText}</strong></div>
      <div className="currency-keypad" role="group" aria-label="計算機數字鍵盤">{keypad.map((key) => {
        if (key === "clear") return <button type="button" className="tool" key={key} onClick={() => setAmount("")} aria-label="清除金額">AC</button>;
        if (key === "backspace") return <button type="button" className="tool" key={key} onClick={() => setAmount((value) => value.slice(0, -1))} aria-label="刪除最後一位">⌫</button>;
        return <button type="button" key={key} onClick={() => append(key)} aria-label={`輸入 ${key}`}>{key}</button>;
      })}</div>
      <div className="currency-rate">{currency.status === "success" ? <><span>1 JPY ≈ {currency.data.rate.toFixed(4)} TWD</span><span>更新日期 {currency.data.date}</span></> : <span>等待最新參考匯率</span>}</div>
    </section>
    <section><div className="section-header"><h2>常用日幣金額</h2><span>一鍵帶入</span></div><div className="quick-amounts">{quickAmounts.map((value)=><button type="button" key={value} onClick={()=>{setDirection("JPY_TWD");setAmount(String(value));}}>¥{jpyFormatter.format(value)}</button>)}</div></section>
    <NoticeBox tone="plain" title="匯率提醒">此為參考匯率，實際刷卡、換匯與銀行牌告可能不同。</NoticeBox>
  </>;
}
