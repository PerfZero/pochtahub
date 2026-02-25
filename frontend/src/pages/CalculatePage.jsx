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
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
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

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#2D2D2D]">
      <header className="w-full flex justify-center px-4 md:px-6 py-4 md:py-6">
        <div className="w-full max-w-[1128px] flex items-center gap-3 md:gap-6">
          <Link to="/calculate" aria-label="На главную Pochtahub">
            <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
          </Link>

          <a
            href="https://t.me/pochtahub_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 text-xs text-[#777E8A] hover:text-[#4B5563]"
          >
            <img src={iconTelegram} alt="" className="w-4 h-4" />
            Telegram
          </a>

          <div className="ml-auto flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                to="/cabinet"
                className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-[#666D78] bg-[#F6F6F7] hover:bg-[#EFEFF1]"
              >
                Личный кабинет
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium text-[#666D78] bg-[#F6F6F7] hover:bg-[#EFEFF1]"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col items-center">
        <section className="w-full flex justify-center px-4 md:px-6 pt-2 md:pt-4 pb-8 md:pb-14">
          <div className="w-full max-w-[1128px] rounded-3xl border border-[#D9DDE4] bg-[#F8F6F2] px-5 md:px-16 py-10 md:py-16">
            <div className="max-w-[760px] mx-auto text-center">
              <h1 className="text-[36px] md:text-[64px] leading-[1.02] tracking-[-0.02em] font-bold text-[#2D2D2D]">
                Ты не оформляешь доставку.
              </h1>
              <p className="mt-5 text-base md:text-[28px] leading-[1.25] text-[#3D4450]">
                Ты просто запускаешь её — мы сделаем остальное.
              </p>

              <button
                type="button"
                onClick={handleStartDelivery}
                className="mt-8 inline-flex items-center justify-center rounded-2xl bg-[#0077FE] px-8 py-4 text-base md:text-lg font-semibold text-white hover:bg-[#0066D9] transition-colors"
              >
                {PRIMARY_CTA_TEXT}
              </button>

              <p className="mt-3 text-sm md:text-base text-[#7A828E]">
                Без регистрации · Без выбора · Без ошибок
              </p>
            </div>
          </div>
        </section>

        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-14">
          <div className="w-full max-w-[1128px]">
            <h2 className="text-2xl md:text-[40px] leading-[1.1] font-bold text-center">
              Что будет дальше
            </h2>
            <ol className="mt-7 md:mt-10 mx-auto max-w-[740px] space-y-4 md:space-y-5 text-base md:text-xl text-[#3A414D]">
              <li>1. Ты запускаешь доставку</li>
              <li>2. Мы связываемся с отправителем</li>
              <li>3. Курьер забирает посылку</li>
              <li>4. Ты подтверждаешь и оплачиваешь</li>
            </ol>
          </div>
        </section>

        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-14">
          <div className="w-full max-w-[1128px] grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <article className="rounded-2xl border border-[#D6DBE3] bg-white p-6 md:p-8">
              <h3 className="text-sm uppercase tracking-[0.08em] text-[#7A828E]">
                Что делаешь ты
              </h3>
              <p className="mt-3 text-2xl md:text-3xl leading-[1.1] font-semibold">
                Запускаешь доставку
              </p>
            </article>
            <article className="rounded-2xl border border-[#D6DBE3] bg-white p-6 md:p-8">
              <h3 className="text-sm uppercase tracking-[0.08em] text-[#7A828E]">
                Что делаем мы
              </h3>
              <p className="mt-3 text-2xl md:text-3xl leading-[1.1] font-semibold">
                Всё остальное
              </p>
            </article>
          </div>
        </section>

        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-14">
          <div className="w-full max-w-[1128px] rounded-2xl border border-[#D6DBE3] bg-[#F7F9FC] p-6 md:p-10">
            <h2 className="text-2xl md:text-[40px] leading-[1.1] font-bold text-center">
              Pochtahub — когда
            </h2>
            <ul className="mt-6 md:mt-8 max-w-[760px] mx-auto space-y-3 text-base md:text-xl text-[#3A414D]">
              <li>• неудобно напоминать отправителю</li>
              <li>• устал ждать</li>
              <li>• обычные сервисы не подходят</li>
              <li>• не хочется разбираться</li>
            </ul>
          </div>
        </section>

        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-14">
          <div className="w-full max-w-[1128px] rounded-2xl border border-[#D6DBE3] bg-white p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl leading-[1.15] font-semibold text-center">
              Это работает и если ты отправляешь посылку
            </h2>
            <ul className="mt-6 md:mt-8 max-w-[760px] mx-auto space-y-3 text-base md:text-xl text-[#3A414D]">
              <li>• ты фотографируешь посылку</li>
              <li>• указываешь, где её забрать</li>
              <li>• вводишь номер получателя</li>
            </ul>
            <p className="mt-6 text-center text-xl md:text-2xl font-semibold">
              Всё остальное — мы.
            </p>
          </div>
        </section>

        <section
          id="launch"
          className="w-full flex justify-center px-4 md:px-6 py-10 md:py-16"
        >
          <div className="w-full max-w-[1128px] rounded-3xl border border-[#CCD4E0] bg-[#F9F6F0] p-8 md:p-12 text-center">
            <p className="text-2xl md:text-4xl leading-[1.1] font-bold">
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

        <section className="w-full flex justify-center px-4 md:px-6 pb-8 md:pb-14">
          <div className="w-full max-w-[1128px] text-center">
            <p className="text-sm md:text-base text-[#6F7785]">
              Отправителю не нужно ничего оформлять. Он просто передаёт посылку
              курьеру.
            </p>
          </div>
        </section>
      </main>

      <footer className="w-full flex justify-center px-4 md:px-6 py-8 md:py-10 border-t border-[#E1E5EB]">
        <div className="w-full max-w-[1128px] flex flex-col md:flex-row items-center gap-4 md:gap-6">
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
              onClick={scrollTop}
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
