import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSvg from "../assets/images/logo.svg";

const TELEGRAM_URL = "https://t.me/pochtahub_bot";

function AvitoPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [toError, setToError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!to.trim()) {
      setToError(true);
      return;
    }
    if (typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "avito_raschet");
    }
    navigate("/wizard", { state: { fromCity: from, toCity: to, source: "avito" } });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-10">
        <img src={logoSvg} alt="PochtaHub" className="h-7" />
      </div>

      <div className="w-full max-w-md">
        {/* Badge */}
        <div className="mb-5">
          <span className="inline-block bg-[#E8F1FF] text-[#0077FE] text-xs font-semibold rounded-full px-3 py-1.5">
            Авито · самовывоз
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-[32px] leading-[1.15] font-bold tracking-tight text-[#0F1724] mb-3">
          Продавец только <span className="text-[#0077FE]">самовывоз?</span>
          <br />
          Курьер заберёт сам
        </h1>

        {/* Subtitle */}
        <p className="text-[#5A6478] text-base leading-relaxed mb-7">
          Укажите откуда и куда — рассчитаем стоимость и заберём товар. Вам ехать не нужно.
        </p>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E5E9F0] rounded-[20px] p-5 shadow-sm"
        >
          {/* From */}
          <div className="mb-1">
            <label className="text-[#5A6478] text-xs font-medium mb-1.5 block">
              Откуда забрать
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">📍</span>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Город продавца или ссылка на объявление"
                className="w-full bg-white border border-[#C8C7CC] rounded-xl pl-10 pr-3 py-3 text-sm text-[#2D2D2D] placeholder-[#858585] focus:outline-none focus:border-[#0077FE] transition-colors"
              />
            </div>
            <p className="text-[#858585] text-xs mt-1.5 pl-0.5">
              Не знаете город — просто вставьте ссылку с Авито
            </p>
          </div>

          {/* Arrow */}
          <div className="text-center text-[#5A6478] text-lg my-2">↓</div>

          {/* To */}
          <div className="mb-5">
            <label className="text-[#5A6478] text-xs font-medium mb-1.5 block">
              Куда доставить
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🏠</span>
              <input
                type="text"
                value={to}
                onChange={(e) => { setTo(e.target.value); setToError(false); }}
                placeholder="Ваш город"
                className={`w-full bg-white border rounded-xl pl-10 pr-3 py-3 text-sm text-[#2D2D2D] placeholder-[#858585] focus:outline-none transition-colors ${toError ? "border-red-400 focus:border-red-400" : "border-[#C8C7CC] focus:border-[#0077FE]"}`}
              />
            </div>
            {toError && (
              <p className="text-red-400 text-xs mt-1.5 pl-0.5">Укажите город доставки</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-[#0077FE] hover:bg-[#0060CC] text-white font-semibold text-sm rounded-xl py-3.5 mb-4 transition-colors"
          >
            Рассчитать стоимость →
          </button>

          {/* Trust points */}
          <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-[#E5E9F0]">
            <div className="flex items-start gap-1.5">
              <span className="text-[#0077FE] mt-0.5 text-xs">●</span>
              <span className="text-[#5A6478] text-xs leading-snug">
                Оплата после того, как курьер забрал товар
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-[#0077FE] mt-0.5 text-xs">●</span>
              <span className="text-[#5A6478] text-xs leading-snug">
                Продавцу ничего оформлять не нужно
              </span>
            </div>
          </div>

          {/* Or */}
          <div className="text-center text-[#858585] text-xs mb-4">или</div>

          {/* Telegram */}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full border border-[#D1D9E6] text-[#1A1A2E] text-sm font-medium rounded-xl py-3.5 text-center hover:border-[#0077FE] hover:text-[#0077FE] transition-colors"
          >
            Написать в Telegram — разберёмся вместе
          </a>
        </form>
      </div>
    </div>
  );
}

export default AvitoPage;
