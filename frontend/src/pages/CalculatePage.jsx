import { useEffect, useState, useCallback, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const DADATA_API_URL =
  "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address";
const DADATA_TOKEN = import.meta.env.VITE_DADATA_TOKEN || "";

import iconTelegram from "../assets/images/icon-telegram.svg";
import iconVerify from "../assets/images/icon-verify.svg";
import logoSvg from "../assets/images/logo.svg";

const PRIMARY_CTA_TEXT = "Я получатель — хочу оформить доставку";
const TELEGRAM_URL = "https://t.me/pochtahub_bot";
const PHONE_DISPLAY = "+7 927 021 32 79";
const PHONE_TEL = "tel:+79270213279";

const HOW_STEPS = [
  {
    n: "01",
    title: "Вы оставляете заявку",
    desc: "Указываете, откуда забрать товар и куда доставить",
  },
  {
    n: "02",
    title: "Мы берём связь на себя",
    desc: "Связываемся с продавцом и договариваемся о заборе",
  },
  {
    n: "03",
    title: "Курьер забирает товар",
    desc: "Продавцу ничего не нужно оформлять — он просто передаёт посылку",
  },
  {
    n: "04",
    title: "Вы получаете и оплачиваете",
    desc: "Только после того, как товар у курьера — никаких рисков",
  },
];

const WHEN_TAGS = [
  "продавец только самовывоз",
  "не хочется ехать далеко",
  "устали ждать",
  "неудобно просить отправителя",
  "обычные сервисы не подходят",
  "не хочется разбираться самому",
];

function CalculatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showStartPopup, setShowStartPopup] = useState(false);

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [toOptions, setToOptions] = useState([]);
  const [toIsOpen, setToIsOpen] = useState(false);
  const toWrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toWrapperRef.current && !toWrapperRef.current.contains(e.target)) {
        setToIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadToSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2 || !DADATA_TOKEN) {
      setToOptions([]);
      setToIsOpen(false);
      return;
    }
    try {
      const response = await axios.post(
        DADATA_API_URL,
        { query, count: 10, from_bound: { value: "city" }, to_bound: { value: "settlement" } },
        { headers: { "Content-Type": "application/json", Authorization: `Token ${DADATA_TOKEN}` } },
      );
      const suggestions = response.data.suggestions
        .filter((item) => (item.data.city || item.data.settlement) && !item.data.street && !item.data.house)
        .map((item) => ({
          value: item.data.city_with_type || item.data.city || item.data.settlement_with_type || item.data.settlement || "",
          id: item.data.fias_id || item.value,
        }))
        .filter((item, i, self) => i === self.findIndex((t) => t.value === item.value))
        .slice(0, 8);
      setToOptions(suggestions);
      setToIsOpen(suggestions.length > 0);
    } catch {
      setToOptions([]);
    }
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!toCity.trim()) return;
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "calc_raschet");
    }
    navigate("/offers", {
      state: { wizardData: { fromCity: fromCity.trim(), toCity: toCity.trim() } },
    });
  };

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("access_token")),
  );

  useEffect(() => {
    const syncAuth = () =>
      setIsAuthenticated(Boolean(localStorage.getItem("access_token")));
    window.addEventListener("storage", syncAuth);
    window.addEventListener("focus", syncAuth);
    window.addEventListener("authChange", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("focus", syncAuth);
      window.removeEventListener("authChange", syncAuth);
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    requestAnimationFrame(() =>
      target.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }, [location.hash]);

  useEffect(() => {
    if (!showStartPopup) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [showStartPopup]);

  const handleStartDelivery = () => setShowStartPopup(true);

  const handleStartPopupContinue = () => {
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "recipient_start");
    }
    setShowStartPopup(false);
    navigate("/wizard?step=recipientRoute", {
      state: { wizardData: { selectedRole: "recipient" } },
    });
  };

  const handleScrollTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="min-h-screen bg-white text-[#1A1A2E] font-sans">

      {/* ───── HEADER ───── */}
      <header className="w-full sticky top-0 z-30 bg-white border-b border-[#E5E9F0]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 h-16 md:h-[72px] flex items-center gap-6">
          <Link to="/calculate" aria-label="Pochtahub главная">
            <img src={logoSvg} alt="PochtaHub" className="h-7 md:h-8" />
          </Link>

          <nav className="hidden md:flex items-center gap-6 ml-4">
            <a href="#how" className="text-sm text-[#5A6478] hover:text-[#0077FE] transition-colors">
              Как работает
            </a>
            <a href="#when" className="text-sm text-[#5A6478] hover:text-[#0077FE] transition-colors">
              Когда нужен
            </a>
            <a href="#launch" className="text-sm text-[#5A6478] hover:text-[#0077FE] transition-colors">
              Контакты
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <a
              href={PHONE_TEL}
              className="hidden md:block text-sm font-medium text-[#1A1A2E] hover:text-[#0077FE] transition-colors"
            >
              {PHONE_DISPLAY}
            </a>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E9F0] text-sm font-medium text-[#5A6478] hover:border-[#0077FE] hover:text-[#0077FE] transition-colors"
            >
              <img src={iconTelegram} alt="" className="w-4 h-4" />
              Telegram
            </a>
            {isAuthenticated ? (
              <Link
                to="/cabinet"
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#0077FE] hover:bg-[#0060CC] transition-colors"
              >
                Личный кабинет
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#5A6478] bg-[#F4F6FA] hover:bg-[#E9EDF5] transition-colors"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ───── HERO ───── */}
      <section className="bg-[#F7F9FC]">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-14 md:py-20 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8F1FF] text-xs font-semibold text-[#0077FE] mb-5">
              🚀 Доставка по всей России
            </div>
            <h1 className="text-[36px] md:text-[56px] leading-[1.05] font-bold tracking-[-0.02em] text-[#0F1724]">
              Просто отправить.<br />Удобно получить.
            </h1>
            <p className="mt-5 text-base md:text-lg text-[#4A5568] leading-relaxed">
              Отправителю не нужно разбираться в доставке — он просто передаёт
              посылку курьеру или сдаёт в пункт приёма.
            </p>
            <p className="mt-2 text-base md:text-lg text-[#4A5568] leading-relaxed">
              Получатель сам выбирает сроки и стоимость, и оплачивает онлайн.
            </p>

            <form onSubmit={handleFormSubmit} className="mt-8 bg-white border border-[#E5E9F0] rounded-2xl p-5 shadow-sm mb-4">
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[#5A6478] mb-1.5">Откуда забрать</label>
                <input
                  type="text"
                  value={fromCity}
                  onChange={(e) => setFromCity(e.target.value)}
                  placeholder="Город продавца или ссылка на объявление"
                  className="w-full border border-[#C8C7CC] rounded-xl px-4 py-3 text-sm text-[#2D2D2D] placeholder-[#858585] focus:outline-none focus:border-[#0077FE] transition-colors"
                />
              </div>
              <div className="mb-4 relative" ref={toWrapperRef}>
                <label className="block text-xs font-semibold text-[#5A6478] mb-1.5">Куда доставить</label>
                <input
                  type="text"
                  value={toCity}
                  onChange={(e) => { setToCity(e.target.value); loadToSuggestions(e.target.value); }}
                  onFocus={() => { if (toOptions.length > 0) setToIsOpen(true); }}
                  placeholder="Ваш город"
                  className="w-full border border-[#C8C7CC] rounded-xl px-4 py-3 text-sm text-[#2D2D2D] placeholder-[#858585] focus:outline-none focus:border-[#0077FE] transition-colors"
                />
                {toIsOpen && toOptions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#C8C7CC] rounded-xl shadow-lg z-50 max-h-52 overflow-auto">
                    {toOptions.map((opt) => (
                      <div
                        key={opt.id}
                        onMouseDown={() => { setToCity(opt.value); setToIsOpen(false); setToOptions([]); }}
                        className="px-4 py-3 text-sm text-[#2D2D2D] cursor-pointer hover:bg-[#F0F7FF] first:rounded-t-xl last:rounded-b-xl"
                      >
                        {opt.value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={!toCity.trim()}
                className="w-full bg-[#0077FE] hover:bg-[#0060CC] disabled:opacity-50 text-white font-semibold text-sm rounded-xl py-3.5 transition-colors"
              >
                Рассчитать стоимость →
              </button>
            </form>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleStartDelivery}
                className="w-full md:w-auto inline-flex items-center justify-center rounded-xl bg-[#0077FE] px-7 py-4 text-base font-semibold text-white hover:bg-[#0060CC] transition-colors shadow-[0_4px_14px_rgba(0,119,254,0.35)]"
              >
                {PRIMARY_CTA_TEXT}
              </button>
            </div>

            <div className="flex flex-col gap-3 mt-3">
              <div className="flex flex-col md:flex-row gap-3">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#D1D9E6] px-6 py-3.5 text-sm font-semibold text-[#1A1A2E] hover:border-[#0077FE] hover:text-[#0077FE] transition-colors bg-white"
                >
                  <img src={iconTelegram} alt="" className="w-4 h-4" />
                  Написать в Telegram
                </a>
                <a
                  href={PHONE_TEL}
                  className="w-full md:w-auto inline-flex items-center justify-center rounded-xl border border-[#D1D9E6] px-6 py-3.5 text-sm font-semibold text-[#1A1A2E] hover:border-[#0077FE] hover:text-[#0077FE] transition-colors bg-white"
                >
                  {PHONE_DISPLAY}
                </a>
              </div>
            </div>

            <p className="mt-4 text-xs text-[#8A94A6]">
              Отвечаем лично. Не бот, не колл-центр.
            </p>
          </div>

          <div className="hidden md:block">
            <img
              src="/1_img.jpg"
              alt="Доставка"
              className="w-full rounded-3xl object-cover shadow-[0_20px_60px_rgba(0,0,0,0.10)]"
              style={{ maxHeight: 480 }}
            />
          </div>
        </div>
      </section>

      {/* ───── TRUST STRIP ───── */}
      <section className="border-y border-[#E5E9F0] bg-white">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-8 md:py-10 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E5E9F0] gap-0">
          {[
            { icon: "🔒", text: "Оплата только после того как курьер забрал товар" },
            { icon: "💬", text: "Живой человек на связи — звоните или пишите" },
            { icon: "📦", text: "Работаем по всей России" },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-4 px-6 py-5 md:py-0 first:pl-0 last:pr-0">
              <span className="text-3xl shrink-0">{icon}</span>
              <p className="text-sm md:text-base text-[#2D3748] font-medium leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───── HOW IT WORKS ───── */}
      <section id="how" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="mb-12 md:mb-14">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0077FE] mb-3">Процесс</p>
            <h2 className="text-[28px] md:text-[44px] font-bold tracking-tight text-[#0F1724]">
              Как это работает
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-5">
            {HOW_STEPS.map((step) => (
              <div key={step.n} className="relative">
                <div className="text-[42px] md:text-[56px] font-black text-[#EBF2FF] leading-none select-none mb-4">
                  {step.n}
                </div>
                <h3 className="text-base md:text-lg font-bold text-[#0F1724] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-[#6B7A99] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── WHEN ───── */}
      <section id="when" className="bg-[#F7F9FC] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8">
          <div className="mb-10 md:mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#0077FE] mb-3">Ситуации</p>
            <h2 className="text-[28px] md:text-[44px] font-bold tracking-tight text-[#0F1724]">
              Pochtahub — когда
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {WHEN_TAGS.map((tag) => (
              <span
                key={tag}
                className="px-4 py-2.5 rounded-full bg-white border border-[#D1D9E6] text-sm md:text-base text-[#2D3748] font-medium shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section id="launch" className="bg-[#0077FE] py-16 md:py-24">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 text-center">
          <h2 className="text-[28px] md:text-[48px] font-bold tracking-tight text-white leading-tight">
            Напишите нам — разберёмся<br className="hidden md:block" /> с вашей ситуацией
          </h2>
          <p className="mt-4 text-base md:text-lg text-[#B8D5FF]">
            Ответим в течение 10 минут
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={handleStartDelivery}
              className="w-full max-w-sm inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-bold text-[#0077FE] hover:bg-[#F0F7FF] transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
            >
              {PRIMARY_CTA_TEXT}
            </button>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#B8D5FF] hover:text-white transition-colors"
            >
              <img src={iconTelegram} alt="" className="w-4 h-4 opacity-75" />
              Или напишите в Telegram →
            </a>
            <a
              href={PHONE_TEL}
              className="text-sm text-[#B8D5FF] hover:text-white transition-colors"
            >
              {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {/* ───── FOOTER ───── */}
      <footer className="bg-[#0F1724] text-white">
        <div className="mx-auto max-w-[1200px] px-4 md:px-8 py-10 md:py-12 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-0 justify-between">
          <div className="flex flex-col items-center md:items-start gap-3">
            <img src={logoSvg} alt="PochtaHub" className="h-7 opacity-90" />
            <div className="flex items-center gap-1.5">
              <img src={iconVerify} alt="" className="w-4 h-4 opacity-50" />
              <span className="text-xs text-[#6B7A99]">Агрегатор транспортных компаний</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
            <a href="/pochtahub.ru:privacy.docx" className="text-xs text-[#6B7A99] hover:text-white transition-colors">
              Политика конфиденциальности
            </a>
            <a href="/pochtahub.ru:terms.docx" className="text-xs text-[#6B7A99] hover:text-white transition-colors">
              Пользовательское соглашение
            </a>
            <button
              type="button"
              onClick={handleScrollTop}
              className="text-xs text-[#6B7A99] hover:text-white transition-colors"
            >
              Наверх ↑
            </button>
          </div>
        </div>
      </footer>

      {/* ───── POPUP ───── */}
      {showStartPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-[900px] overflow-hidden rounded-[28px] border border-[#D6DEEA] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-end px-4 pt-4">
              <button
                type="button"
                onClick={() => setShowStartPopup(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#7A8594] transition-colors hover:bg-[#F2F5F9] hover:text-[#223047] text-xl"
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            <div className="px-4 pb-4 md:px-6 md:pb-6">
              <img
                src="/pop.jpg"
                alt="Подсказка перед запуском"
                className="w-full rounded-[22px] border border-[#E2E8F0]"
              />
              <div className="mt-5 flex justify-center">
                <button
                  type="button"
                  onClick={handleStartPopupContinue}
                  className="inline-flex items-center justify-center rounded-xl bg-[#0077FE] px-8 py-4 text-base font-semibold text-white transition-colors hover:bg-[#0060CC] md:text-lg"
                >
                  Далее
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalculatePage;
