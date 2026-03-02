import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import PhoneInput from "../components/PhoneInput";
import iconTelegram from "../assets/images/icon-telegram.svg";
import logoSvg from "../assets/images/logo.svg";

const METRIKA_ID = 104664178;
const STORAGE_KEY = "abc_landing_variant";

const OFFER_VARIANTS = {
  a: {
    title: "ОБЕЩАЛ ОТПРАВИТЬ - И ТИШИНА?",
    lead: "Вы ждёте, а ничего не происходит.",
    body: [
      "Так бывает.",
      "Договорённость есть, но действие остаётся не у вас.",
      "Вы ещё не ошиблись и не опоздали.",
    ],
    ctaPrompt:
      "Хотите понять, что можно сделать дальше, пока ситуация не стала конфликтом?",
    ctaText: "Показать, как вернуть контроль",
    footnote: "Никаких оплат. Просто разберём ситуацию.",
  },
  b: {
    title: "ДОГОВОРИЛИСЬ ОБ ОТПРАВКЕ, НО ВСЁ ЗАСТРЯЛО?",
    lead: "Посылка не едет, а вы остаетесь в ожидании.",
    body: [
      "Это обычная ситуация.",
      "Отправить вроде обещали, но следующий шаг зависит не от вас.",
      "Сейчас ещё можно спокойно вернуть процесс под контроль.",
    ],
    ctaPrompt:
      "Хотите быстро понять, как сдвинуть отправку с места без лишнего напряжения?",
    ctaText: "Показать следующий шаг",
    footnote: "Без оплат и обязательств. Просто покажем, как действовать.",
  },
  c: {
    title: "ПОСЫЛКУ ДОЛЖНЫ БЫЛИ ОТПРАВИТЬ, НО НИЧЕГО НЕ МЕНЯЕТСЯ?",
    lead: "Вы ждёте подтверждения, а процесс так и не начался.",
    body: [
      "Такое случается часто.",
      "Сама договорённость уже есть, но управление остаётся у другой стороны.",
      "Это можно исправить до того, как ситуация станет неприятной.",
    ],
    ctaPrompt:
      "Хотите увидеть, как аккуратно вернуть себе контроль над отправкой?",
    ctaText: "Показать, что делать дальше",
    footnote: "Никаких оплат. Только понятный следующий шаг.",
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
  const [phone, setPhone] = useState("");

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

  const variant = OFFER_VARIANTS[variantKey];

  const handleContinue = () => {
    trackMetrika("abc_cta_click", {
      variant: variantKey,
      source: "abc",
      has_phone: Boolean(phone.trim()),
    });

    navigate("/wizard?step=recipientRoute", {
      state: {
        wizardData: {
          selectedRole: "recipient",
          source: "abc",
          abcVariant: variantKey,
          contactPhone: phone,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1E3557_0%,#10233D_48%,#0A1426_100%)] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-4 pb-8 pt-5 md:px-6 md:pb-12 md:pt-6">
        <header className="flex items-center gap-4">
          <Link to="/calculate" aria-label="Pochtahub главная">
            <img src={logoSvg} alt="Pochtahub" className="h-7 md:h-9 brightness-[6]" />
          </Link>

          <a
            href="https://t.me/pochtahub_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto hidden items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/12 md:inline-flex"
          >
            <img src={iconTelegram} alt="" className="h-4 w-4" />
            Telegram
          </a>
        </header>

        <main className="flex flex-1 items-center justify-center py-6 md:py-10">
          <section className="w-full max-w-[760px] overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] shadow-[0_35px_120px_rgba(0,0,0,0.32)] backdrop-blur-sm">
            <div className="px-6 py-8 md:px-10 md:py-11">
              <h1 className="max-w-[560px] text-[30px] font-bold uppercase leading-[1.02] tracking-[-0.03em] text-white md:text-[54px]">
                {variant.title}
              </h1>

              <p className="mt-6 max-w-[460px] text-lg leading-[1.35] text-[#D9E6F7] md:text-[27px]">
                {variant.lead}
              </p>
            </div>

            <div className="h-px bg-white/12" />

            <div className="px-6 py-8 md:px-10 md:py-10">
              <div className="max-w-[520px] space-y-4 text-base leading-7 text-[#E5EDF8] md:text-[24px] md:leading-[1.45]">
                {variant.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/12" />

            <div className="px-6 py-8 md:px-10 md:py-10">
              <p className="max-w-[560px] text-lg leading-[1.45] text-white md:text-[30px] md:leading-[1.26]">
                {variant.ctaPrompt}
              </p>

              <div className="mt-6 max-w-[420px]">
                <PhoneInput
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  label="Телефон"
                />
              </div>

              <button
                type="button"
                onClick={handleContinue}
                className="mt-5 inline-flex items-center gap-3 rounded-full border border-[#7FB6FF] bg-[#1683FF] px-6 py-4 text-left text-base font-semibold text-white shadow-[0_18px_40px_rgba(22,131,255,0.28)] transition-all hover:-translate-y-0.5 hover:bg-[#0F76EF] md:text-xl"
              >
                <span className="text-xl leading-none md:text-2xl">⌄</span>
                {variant.ctaText}
              </button>

              <p className="mt-6 text-sm text-[#9FB4CB] md:text-base">
                * {variant.footnote}
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AbcLandingPage;
