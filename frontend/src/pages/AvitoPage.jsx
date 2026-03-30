import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSvg from "../assets/images/logo.svg";

const TELEGRAM_URL = "https://t.me/pochtahub_bot";

function AvitoPage() {
  const navigate = useNavigate();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/wizard", { state: { fromCity: from, toCity: to, source: "avito" } });
  };

  return (
    <div className="min-h-screen bg-[#0F1724] font-sans flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-10">
        <img src={logoSvg} alt="PochtaHub" className="h-7 opacity-90" />
      </div>

      <div className="w-full max-w-md">
        {/* Badge */}
        <div className="mb-5">
          <span className="inline-block bg-[#E8F1FF] text-[#0077FE] text-xs font-semibold rounded-full px-3 py-1.5">
            Авито · самовывоз
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-[32px] leading-[1.15] font-bold tracking-tight text-white mb-3">
          Продавец только <span className="text-[#0077FE]">самовывоз?</span>
          <br />
          Курьер заберёт сам
        </h1>

        {/* Subtitle */}
        <p className="text-[#6B7A99] text-base leading-relaxed mb-7">
          Укажите откуда и куда — рассчитаем стоимость и заберём товар. Вам ехать не нужно.
        </p>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-[20px] p-5"
        >
          {/* From */}
          <div className="mb-1">
            <label className="text-[#6B7A99] text-xs font-medium mb-1.5 block">
              Откуда забрать
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">📍</span>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="Город продавца или ссылка на объявление"
                className="w-full bg-[#0F1724] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-[#6B7A99] focus:outline-none focus:border-[#0077FE] transition-colors"
              />
            </div>
            <p className="text-[#6B7A99] text-xs mt-1.5 pl-0.5">
              Не знаете город — просто вставьте ссылку с Авито
            </p>
          </div>

          {/* Arrow */}
          <div className="text-center text-[#6B7A99] text-lg my-2">↓</div>

          {/* To */}
          <div className="mb-5">
            <label className="text-[#6B7A99] text-xs font-medium mb-1.5 block">
              Куда доставить
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">🏠</span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Ваш город"
                className="w-full bg-[#0F1724] border border-white/10 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-[#6B7A99] focus:outline-none focus:border-[#0077FE] transition-colors"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-white text-[#0F1724] font-semibold text-sm rounded-xl py-3.5 mb-4 hover:bg-[#E8EDF5] transition-colors"
          >
            Рассчитать стоимость →
          </button>

          {/* Trust points */}
          <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-white/10">
            <div className="flex items-start gap-1.5">
              <span className="text-[#0077FE] mt-0.5 text-xs">●</span>
              <span className="text-[#6B7A99] text-xs leading-snug">
                Оплата после того, как курьер забрал товар
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-[#0077FE] mt-0.5 text-xs">●</span>
              <span className="text-[#6B7A99] text-xs leading-snug">
                Продавцу ничего оформлять не нужно
              </span>
            </div>
          </div>

          {/* Or */}
          <div className="text-center text-[#6B7A99] text-xs mb-4">или</div>

          {/* Telegram */}
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full border border-white/10 text-white text-sm font-medium rounded-xl py-3.5 text-center hover:border-[#0077FE] hover:text-[#0077FE] transition-colors"
          >
            Написать в Telegram — разберёмся вместе
          </a>
        </form>
      </div>
    </div>
  );
}

export default AvitoPage;
