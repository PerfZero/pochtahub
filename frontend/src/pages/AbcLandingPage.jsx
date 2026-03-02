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
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_5%,#E9F4FF_0%,#F7FAFF_30%,#F4F6FA_55%,#F7F3EC_100%)] text-[#1F2630]">
      <header className="w-full sticky top-0 z-20 border-b border-[#DCE2EB] bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1128px] items-center gap-4 px-4 md:h-[84px] md:px-6">
          <Link to="/calculate" aria-label="Pochtahub главная">
            <img src={logoSvg} alt="Pochtahub" className="h-7 md:h-9" />
          </Link>

          <a
            href="https://t.me/pochtahub_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto hidden items-center gap-2 text-xs font-medium text-[#6F7785] hover:text-[#4F5968] md:inline-flex"
          >
            <img src={iconTelegram} alt="" className="h-4 w-4" />
            Telegram
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1128px] px-4 pb-10 pt-6 md:px-6 md:pb-16 md:pt-10">
        <section className="relative overflow-hidden rounded-[30px] border border-[#1D6DE8]/20 bg-gradient-to-br from-[#0D69EA] via-[#1B80FF] to-[#4EA7FF] px-6 py-8 shadow-[0_30px_90px_rgba(15,93,207,0.25)] md:px-10 md:py-11">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
          <div className="absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-[#9BC9FF]/35 blur-2xl" />

          <div className="relative grid items-start gap-6 md:grid-cols-[1fr_0.92fr] md:gap-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D7EAFF]">
                Сценарий ожидания
              </p>

              <h1 className="mt-5 max-w-[620px] text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-white md:text-[62px]">
                {variant.title}
              </h1>

              <p className="mt-5 max-w-[520px] text-base leading-[1.35] text-[#EAF4FF] md:text-[28px]">
                {variant.lead}
              </p>
            </div>

            <div className="rounded-3xl border border-white/25 bg-white/12 p-5 backdrop-blur-sm md:p-6">
              <p className="text-xs uppercase tracking-[0.12em] text-[#D9EBFF]">
                Что происходит
              </p>
              <div className="mt-4 space-y-3">
                {variant.body.map((paragraph, index) => (
                  <div
                    key={paragraph}
                    className="flex items-start gap-3 text-sm text-white md:text-base"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      {index + 1}
                    </span>
                    <p>{paragraph}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pt-8 md:pt-10">
          <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr] md:gap-5">
            <article className="rounded-2xl border border-[#D7DEE8] bg-white/85 px-5 py-6 shadow-[0_10px_30px_rgba(16,41,77,0.06)] md:px-6 md:py-7">
              <p className="text-sm uppercase tracking-[0.08em] text-[#748095]">
                Что это значит
              </p>
              <p className="mt-3 text-lg font-semibold leading-[1.25] text-[#273142] md:text-2xl">
                Договорённость есть, но управление процессом пока не у вас.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#5F6C7B] md:text-base">
                Ваша задача здесь не давить, а аккуратно вернуть понятный
                следующий шаг.
              </p>
            </article>

            <article className="rounded-2xl border border-[#D5DDE8] bg-[#F7F3EA] px-5 py-6 shadow-[0_10px_30px_rgba(16,41,77,0.05)] md:px-6 md:py-7">
              <p className="text-sm uppercase tracking-[0.08em] text-[#8A7350]">
                Спокойный выход
              </p>
              <p className="mt-3 text-lg font-semibold leading-[1.25] text-[#2E2A22] md:text-2xl">
                Сначала понять, что делать дальше. Потом уже запускать действие.
              </p>
              <p className="mt-3 text-sm leading-6 text-[#6E6253] md:text-base">
                Поэтому здесь не продажа и не оплата, а вход в сценарий, который
                снимает подвешенность.
              </p>
            </article>
          </div>
        </section>

        <section className="pt-8 md:pt-10">
          <div className="rounded-[30px] border border-[#CBD4E2] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(16,41,77,0.08)] md:px-10 md:py-10">
            <div className="max-w-[720px]">
              <p className="text-2xl font-bold leading-[1.15] text-[#202938] md:text-[42px]">
                {variant.ctaPrompt}
              </p>
            </div>

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
              className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-[#0077FE] px-6 py-4 text-left text-base font-semibold text-white transition-colors hover:bg-[#0066D9] md:text-lg"
            >
              <span className="text-lg leading-none">⌄</span>
              {variant.ctaText}
            </button>

            <p className="mt-4 text-sm text-[#7A828E] md:text-base">
              * {variant.footnote}
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AbcLandingPage;
