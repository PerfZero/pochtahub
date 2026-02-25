import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import iconTelegram from "../assets/images/icon-telegram.svg";
import iconVerify from "../assets/images/icon-verify.svg";
import logoSvg from "../assets/images/logo.svg";

const PRIMARY_CTA_TEXT = "Запустить доставку";

function CalculatePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("access_token")),
  );

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("access_token")));
    };

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
    if (!location.hash) {
      return;
    }

    const target = document.getElementById(location.hash.slice(1));
    if (!target) {
      return;
    }

    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.hash]);

  const handleStartDelivery = () => {
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "recipient_start");
    }

    navigate("/wizard?step=recipientRoute", {
      state: {
        wizardData: {
          selectedRole: "recipient",
        },
      },
    });
  };

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_5%,#E9F4FF_0%,#F7FAFF_30%,#F4F6FA_55%,#F7F3EC_100%)] text-[#1F2630]">
      <header className="w-full sticky top-0 z-20 backdrop-blur-md bg-white/70 border-b border-[#DCE2EB]">
        <div className="mx-auto max-w-[1128px] px-4 md:px-6 h-[72px] md:h-[84px] flex items-center gap-4">
          <Link to="/calculate" aria-label="Pochtahub главная">
            <img src={logoSvg} alt="PochtaHub" className="h-7 md:h-9" />
          </Link>

          <a
            href="https://t.me/pochtahub_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 text-xs font-medium text-[#6F7785] hover:text-[#4F5968]"
          >
            <img src={iconTelegram} alt="" className="w-4 h-4" />
            Telegram
          </a>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/cabinet"
                className="px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium text-[#6B7280] bg-[#F2F4F7] hover:bg-[#E9EDF3] transition-colors"
              >
                Личный кабинет
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-lg text-xs md:text-sm font-medium text-[#6B7280] bg-[#F2F4F7] hover:bg-[#E9EDF3] transition-colors"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1128px] px-4 md:px-6 pb-10 md:pb-16">
        <section className="pt-6 md:pt-10">
          <div className="relative overflow-hidden rounded-[30px] border border-[#1D6DE8]/20 bg-gradient-to-br from-[#0D69EA] via-[#1B80FF] to-[#4EA7FF] px-6 md:px-10 py-8 md:py-11 shadow-[0_30px_90px_rgba(15,93,207,0.25)]">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -left-16 -bottom-20 h-56 w-56 rounded-full bg-[#9BC9FF]/35 blur-2xl" />

            <div className="relative grid md:grid-cols-[1.1fr_0.9fr] gap-8 md:gap-10 items-center">
              <div>
                <span className="inline-flex rounded-full border border-white/35 bg-white/15 px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/90">
                  Спокойный запуск
                </span>

                <h1 className="mt-5 text-[34px] leading-[1.02] md:text-[64px] font-bold tracking-[-0.02em] text-white">
                  Ты не оформляешь
                  <br />
                  доставку.
                </h1>

                <p className="mt-5 text-base md:text-[30px] leading-[1.18] text-[#EAF4FF]">
                  Ты просто запускаешь её — мы сделаем остальное.
                </p>

                <button
                  type="button"
                  onClick={handleStartDelivery}
                  className="mt-8 inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base md:text-lg font-semibold text-[#0D63DA] hover:bg-[#F2F8FF] transition-colors"
                >
                  {PRIMARY_CTA_TEXT}
                </button>

                <p className="mt-3 text-sm md:text-base text-[#D7EAFF]">
                  Без регистрации · Без выбора · Без ошибок
                </p>
              </div>

              <div className="rounded-3xl border border-white/25 bg-white/12 backdrop-blur-sm p-5 md:p-6">
                <p className="text-xs uppercase tracking-[0.12em] text-[#D9EBFF]">
                  Маршрут прозрачный
                </p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3 text-sm md:text-base text-white">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      1
                    </span>
                    Запуск без лишних решений
                  </li>
                  <li className="flex items-start gap-3 text-sm md:text-base text-white">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      2
                    </span>
                    Контакт с отправителем берём на себя
                  </li>
                  <li className="flex items-start gap-3 text-sm md:text-base text-white">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      3
                    </span>
                    Курьер забирает посылку
                  </li>
                  <li className="flex items-start gap-3 text-sm md:text-base text-white">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                      4
                    </span>
                    Ты подтверждаешь и оплачиваешь
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="pt-10 md:pt-14">
          <h2 className="text-2xl md:text-[42px] leading-[1.08] font-bold text-center">
            Что будет дальше
          </h2>

          <div className="mt-7 md:mt-10 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {[
              "Ты запускаешь доставку",
              "Мы связываемся с отправителем",
              "Курьер забирает посылку",
              "Ты подтверждаешь и оплачиваешь",
            ].map((step, index) => (
              <article
                key={step}
                className="rounded-2xl border border-[#D7DEE8] bg-white/85 px-5 md:px-6 py-5 md:py-6 shadow-[0_10px_30px_rgba(16,41,77,0.06)]"
              >
                <p className="text-sm uppercase tracking-[0.08em] text-[#748095]">
                  Шаг {index + 1}
                </p>
                <p className="mt-2 text-lg md:text-2xl leading-[1.2] font-semibold text-[#273142]">
                  {step}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="pt-10 md:pt-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            <article className="rounded-2xl border border-[#D5DDE8] bg-[#F8FBFF] px-6 md:px-7 py-6 md:py-7">
              <p className="text-xs uppercase tracking-[0.12em] text-[#6E7F95]">
                Что делаешь ты
              </p>
              <p className="mt-4 text-3xl md:text-4xl leading-[1.02] font-bold text-[#1D2B3F]">
                Запускаешь
                <br />
                доставку
              </p>
            </article>

            <article className="rounded-2xl border border-[#D5DDE8] bg-[#FFF9F1] px-6 md:px-7 py-6 md:py-7">
              <p className="text-xs uppercase tracking-[0.12em] text-[#7D7464]">
                Что делаем мы
              </p>
              <p className="mt-4 text-3xl md:text-4xl leading-[1.02] font-bold text-[#2E2A22]">
                Всё
                <br />
                остальное
              </p>
            </article>
          </div>
        </section>

        <section className="pt-10 md:pt-14">
          <div className="rounded-2xl border border-[#202B3A] bg-gradient-to-br from-[#1C2533] to-[#121A26] px-6 md:px-8 py-7 md:py-9 text-white">
            <h2 className="text-2xl md:text-[42px] leading-[1.08] font-bold text-center md:text-left">
              Pochtahub — когда
            </h2>

            <ul className="mt-6 md:mt-7 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-base md:text-xl text-[#E5EDF9]">
              <li className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                когда самовывоз
              </li>
              <li className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                неудобно напоминать отправителю
              </li>
              <li className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                устал ждать
              </li>
              <li className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                обычные сервисы не подходят
              </li>
              <li className="rounded-xl border border-white/15 bg-white/5 px-4 py-3">
                не хочется разбираться
              </li>
            </ul>
          </div>
        </section>

        <section className="pt-10 md:pt-14">
          <div className="rounded-2xl border border-[#D7DEE8] bg-white px-6 md:px-8 py-7 md:py-9 shadow-[0_12px_30px_rgba(16,41,77,0.06)]">
            <h2 className="text-2xl md:text-3xl leading-[1.15] font-semibold text-center">
              Это работает и если ты отправляешь посылку
            </h2>

            <ul className="mt-6 md:mt-7 max-w-[760px] mx-auto space-y-3 text-base md:text-xl text-[#3A414D]">
              <li>• ты фотографируешь посылку</li>
              <li>• указываешь, где её забрать</li>
              <li>• вводишь номер получателя</li>
            </ul>

            <p className="mt-6 text-center text-xl md:text-2xl font-semibold text-[#202938]">
              Всё остальное — мы.
            </p>
          </div>
        </section>

        <section id="launch" className="pt-10 md:pt-14">
          <div className="rounded-[30px] border border-[#CBD4E2] bg-[#F7F3EA] px-6 md:px-10 py-10 md:py-12 text-center">
            <span className="inline-flex rounded-full border border-[#D8CDB5] bg-[#FFF8EA] px-4 py-1.5 text-xs uppercase tracking-[0.12em] text-[#907B51]">
              Финальный шаг
            </span>

            <p className="mt-5 text-3xl md:text-[52px] leading-[1.02] tracking-[-0.02em] font-bold text-[#202938]">
              До запуска доставки — один шаг
            </p>

            <button
              type="button"
              onClick={handleStartDelivery}
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#0077FE] px-8 py-4 text-base md:text-lg font-semibold text-white hover:bg-[#0066D9] transition-colors"
            >
              {PRIMARY_CTA_TEXT}
            </button>

            <p className="mt-3 text-sm md:text-base text-[#7A828E]">
              Займёт меньше минуты
            </p>
          </div>
        </section>

        <section className="pt-8 md:pt-10 pb-4 md:pb-6">
          <p className="text-center text-sm md:text-base text-[#6E7785]">
            Отправителю не нужно ничего оформлять. Он просто передаёт посылку
            курьеру.
          </p>
        </section>
      </main>

      <footer className="w-full border-t border-[#DCE2EB] bg-white/90">
        <div className="mx-auto max-w-[1128px] px-4 md:px-6 py-7 md:py-8 flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />

          <div className="hidden md:flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-5 h-5" />
            <span className="text-xs text-[#667080]">
              Агрегатор транспортных компаний
            </span>
          </div>

          <div className="md:ml-auto flex flex-wrap items-center justify-center gap-3 md:gap-6">
            <a
              href="/pochtahub.ru:privacy.docx"
              className="text-xs text-[#78808D] hover:text-[#4B5563]"
            >
              Политика конфиденциальности
            </a>
            <a
              href="/pochtahub.ru:terms.docx"
              className="text-xs text-[#78808D] hover:text-[#4B5563]"
            >
              Пользовательское соглашение
            </a>
            <button
              type="button"
              onClick={handleScrollTop}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#4B5563] hover:bg-[#F4EEE2]"
            >
              Наверх
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F2F3]">
                ↑
              </span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default CalculatePage;
