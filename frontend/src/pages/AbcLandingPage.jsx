import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import iconTelegram from "../assets/images/icon-telegram.svg";
import logoSvg from "../assets/images/logo.svg";

const METRIKA_ID = 104664178;
const STORAGE_KEY = "abc_landing_variant";
const PRIMARY_CTA_TEXT = "Запустить доставку";

const OFFER_VARIANTS = {
  a: {
    label: "A",
    eyebrow: "Без давления на отправителя",
    title: "Не нужно уговаривать отправителя заниматься доставкой.",
    subtitle:
      "Ты просто запускаешь доставку, а мы сами связываемся, объясняем процесс и доводим его до забора посылки.",
    accent: "Подходит, когда отправитель тянет, забывает или не хочет разбираться.",
    bullets: [
      "Ты запускаешь доставку",
      "Мы общаемся с отправителем",
      "Курьер сам забирает посылку",
    ],
    panelTitle: "Почему это работает",
    panelText:
      "Пользователь не спорит, не напоминает и не координирует всё вручную.",
  },
  b: {
    label: "B",
    eyebrow: "Когда самовывоз не хочется даже рассматривать",
    title: "Не надо ехать за посылкой самому.",
    subtitle:
      "Если самовывоз неудобен, далеко или просто не хочется тратить полдня, Pochtahub запускает доставку за тебя.",
    accent: "Особенно полезно, когда посылка в другом городе или у занятого отправителя.",
    bullets: [
      "Ты оставляешь маршрут",
      "Мы организуем контакт и забор",
      "Ты подключаешься только на подтверждении",
    ],
    panelTitle: "Что снимается сразу",
    panelText:
      "Неловкие договорённости, поездки через город и контроль каждого шага вручную.",
  },
  c: {
    label: "C",
    eyebrow: "Когда обычные сервисы только добавляют трение",
    title: "Ты не оформляешь доставку. Ты просто запускаешь её.",
    subtitle:
      "Без выбора ролей, без длинных объяснений отправителю и без ощущения, что сейчас ошибёшься в форме.",
    accent: "Один сценарий: запустил, подтвердил, получил.",
    bullets: [
      "Без сложного выбора",
      "Без лишних касаний с отправителем",
      "Без ручной координации доставки",
    ],
    panelTitle: "Главный паттерн",
    panelText:
      "Сервис берёт на себя самую неприятную часть процесса, а не перекладывает её на пользователя.",
  },
};

function getSearchVariant(search) {
  const params = new URLSearchParams(search);
  const rawVariant = params.get("variant")?.toLowerCase();

  return rawVariant && OFFER_VARIANTS[rawVariant] ? rawVariant : null;
}

function pickRandomVariant() {
  const keys = Object.keys(OFFER_VARIANTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

function trackMetrika(goal, params = {}) {
  if (typeof window === "undefined" || typeof window.ym !== "function") {
    return;
  }

  window.ym(METRIKA_ID, "reachGoal", goal, params);
}

function AbcLandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [variantKey, setVariantKey] = useState("a");

  useEffect(() => {
    const forcedVariant = getSearchVariant(location.search);

    if (forcedVariant) {
      setVariantKey(forcedVariant);
      return;
    }

    const savedVariant = localStorage.getItem(STORAGE_KEY);
    if (savedVariant && OFFER_VARIANTS[savedVariant]) {
      setVariantKey(savedVariant);
      return;
    }

    const randomVariant = pickRandomVariant();
    localStorage.setItem(STORAGE_KEY, randomVariant);
    setVariantKey(randomVariant);
  }, [location.search]);

  useEffect(() => {
    trackMetrika("abc_view", { variant: variantKey, source: "abc" });
  }, [variantKey]);

  const variant = useMemo(() => OFFER_VARIANTS[variantKey], [variantKey]);

  const handleStartDelivery = () => {
    trackMetrika("abc_cta_click", { variant: variantKey, source: "abc" });

    navigate("/wizard?step=recipientRoute", {
      state: {
        wizardData: {
          selectedRole: "recipient",
          source: "abc",
          abcVariant: variantKey,
        },
      },
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#F7EFE2_0%,#F7FAFF_42%,#E8F3FF_100%)] text-[#1E2837]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-8%] top-[-10%] h-[320px] w-[320px] rounded-full bg-[#FFD8A8]/45 blur-3xl" />
        <div className="absolute right-[-4%] top-[12%] h-[360px] w-[360px] rounded-full bg-[#8BC4FF]/35 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[25%] h-[280px] w-[280px] rounded-full bg-[#C7E7FF]/45 blur-3xl" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-5 md:px-6 md:py-6">
          <Link to="/calculate" aria-label="Pochtahub главная">
            <img src={logoSvg} alt="Pochtahub" className="h-7 md:h-9" />
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <a
              href="https://t.me/pochtahub_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs font-medium text-[#5D6877] backdrop-blur-sm transition-colors hover:bg-white"
            >
              <img src={iconTelegram} alt="" className="h-4 w-4" />
              Telegram
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-[calc(100vh-84px)] max-w-[1180px] items-center px-4 pb-10 md:px-6 md:pb-14">
        <section className="grid w-full gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_30px_120px_rgba(35,57,93,0.14)] backdrop-blur-xl md:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7C8796]">
              {variant.eyebrow}
            </p>

            <h1 className="mt-4 max-w-[720px] text-[34px] font-bold leading-[0.96] tracking-[-0.04em] text-[#132033] md:text-[68px]">
              {variant.title}
            </h1>

            <p className="mt-5 max-w-[640px] text-base leading-[1.5] text-[#445064] md:text-[22px] md:leading-[1.38]">
              {variant.subtitle}
            </p>

            <div className="mt-6 inline-flex max-w-[680px] rounded-2xl border border-[#D7E5F6] bg-[#F3F8FF] px-4 py-3 text-sm text-[#355070] md:text-base">
              {variant.accent}
            </div>

            <div className="mt-8 flex flex-col items-start gap-4 md:flex-row md:items-center">
              <button
                type="button"
                onClick={handleStartDelivery}
                className="inline-flex min-h-[58px] items-center justify-center rounded-2xl bg-[#1573FF] px-8 py-4 text-base font-semibold text-white shadow-[0_20px_50px_rgba(21,115,255,0.3)] transition-all hover:-translate-y-0.5 hover:bg-[#0F67E5]"
              >
                {PRIMARY_CTA_TEXT}
              </button>

              <p className="text-sm text-[#667384] md:text-base">
                Один экран. Один CTA. Сразу в сценарий запуска.
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <article className="rounded-[28px] border border-[#D9E5F2] bg-[#13294B] p-6 text-white shadow-[0_24px_80px_rgba(17,42,84,0.22)] md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#96BFFF]">
                Что получает пользователь
              </p>

              <ul className="mt-5 space-y-3">
                {variant.bullets.map((bullet, index) => (
                  <li
                    key={bullet}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-sm font-semibold text-[#D9E8FF]">
                      {index + 1}
                    </span>
                    <span className="text-sm leading-6 text-[#EEF5FF] md:text-base">
                      {bullet}
                    </span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-[28px] border border-[#D8E2EE] bg-[#FFF7EA] p-6 text-[#2B3442] shadow-[0_20px_60px_rgba(55,71,98,0.08)] md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8F6A2A]">
                {variant.panelTitle}
              </p>
              <p className="mt-4 text-lg font-semibold leading-[1.2] md:text-[28px]">
                {variant.panelText}
              </p>
              <p className="mt-5 text-sm leading-6 text-[#5B6675] md:text-base">
                Если захочешь посмотреть конкретный вариант вручную, используй
                `?variant=a`, `?variant=b` или `?variant=c`.
              </p>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AbcLandingPage;
