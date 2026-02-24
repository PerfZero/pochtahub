import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import BusinessAuthModal from "../components/BusinessAuthModal";
import heroConcept from "../assets/images/hero-concept.svg";
import iconArrowRight from "../assets/images/icon-arrow-right.svg";
import iconTelegram from "../assets/images/icon-telegram.svg";
import iconVerify from "../assets/images/icon-verify.svg";
import logoSvg from "../assets/images/logo.svg";
import logosStrip from "../assets/images/logos-strip.svg";
import qrCode from "../assets/images/qr-code.jpg";
import { trackBusinessEvent } from "../utils/businessAnalytics";

function BusinessPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(
    () => Boolean(localStorage.getItem("access_token")),
  );
  const [showAuthModal, setShowAuthModal] = useState(
    () => Boolean(location.state?.openLogin),
  );

  useEffect(() => {
    trackBusinessEvent("business_page_view", {}, { oncePerSession: true });
  }, []);

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
    if (location.state?.openLogin) {
      navigate("/business", { replace: true });
    }
  }, [location.state?.openLogin, navigate]);

  const handleCtaClick = () => {
    if (isAuthenticated) {
      navigate("/business/tool");
      return;
    }
    setShowAuthModal(true);
  };

  const handleLoginSuccess = async () => {
    setIsAuthenticated(true);
    await trackBusinessEvent("business_login_success", {
      metadata: { source: "business" },
    });
    navigate("/business/tool");
  };

  return (
    <>
      <BusinessAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <div className="min-h-screen flex flex-col items-center bg-white">
        <div className="w-full bg-[#ADD3FF] flex justify-center">
          <div className="w-full max-w-[1128px] px-6 py-2 flex items-center justify-center gap-3">
            <img src={iconTelegram} alt="" className="w-6 h-6" />
            <span className="text-sm font-semibold text-[#2D2D2D] text-center">
              Закрытый business-инструмент Pochtahub для расчёта габаритов по фото
            </span>
            <img src={iconArrowRight} alt="" className="w-6 h-6" />
          </div>
        </div>

        <header className="w-full flex justify-center items-center p-4 md:p-6">
          <div className="w-full max-w-[1128px] flex items-center gap-3 md:gap-6">
            <Link to="/calculate">
              <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <img src={iconVerify} alt="" className="w-6 h-6" />
              <span className="text-xs text-[#2D2D2D]">
                Агрегатор транспортных компаний
              </span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {isAuthenticated ? (
                <Link
                  to="/business/tool"
                  className="hidden md:inline-block px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                >
                  Открыть инструмент
                </Link>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="hidden md:inline-block px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                >
                  Войти
                </button>
              )}
              <button
                onClick={handleCtaClick}
                className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-[#0077FE] text-white"
              >
                Войти и рассчитать
              </button>
            </div>
          </div>
        </header>

        <section
          id="business-hero"
          className="w-full flex justify-center px-4 md:px-6"
        >
          <div className="w-full max-w-[1128px] border-[0.5px] border-[#C8C7CC] rounded-2xl">
            <div className="bg-[#EEE5D3] py-2 flex items-center justify-center border-[0.5px] border-[#C8C7CC] rounded-t-2xl">
              <img
                src={logosStrip}
                alt=""
                className="w-full max-w-full h-auto"
              />
            </div>

            <div className="bg-[#F9F6F0] px-4 md:px-[72px] py-6 md:py-0 flex flex-col md:flex-row items-center md:items-end justify-center gap-6 md:gap-8">
              <div className="flex-1 flex flex-col justify-center gap-4 md:gap-6 py-6 md:py-12">
                <h1 className="text-2xl md:text-[48px] font-bold leading-[1.2] text-[#2D2D2D] text-center md:text-left">
                  Расчёт габаритов по фото для логистики
                </h1>
                <p className="text-sm md:text-base leading-[1.5] text-[#2D2D2D] text-center md:text-left">
                  Быстро получайте размеры посылки по фото. Удобно, когда
                  поставщик тянет или указывает габариты примерно.
                </p>

                <div className="flex flex-col items-center md:items-start gap-3">
                  <button
                    type="button"
                    onClick={handleCtaClick}
                    className="px-6 py-4 rounded-[10px] text-base font-semibold bg-[#0077FE] text-white"
                  >
                    Войти и рассчитать
                  </button>
                  <p className="text-sm text-[#858585]">
                    7 дней бесплатно для тестирования. Без обязательств.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={heroConcept}
                  alt="Расчёт габаритов"
                  className="h-[180px] md:h-[360px] w-auto"
                />
              </div>
            </div>

            <div className="bg-[#F9F6F0] px-6 py-4 flex items-center justify-center rounded-b-2xl border-t border-[#E3DDD3]">
              <p className="text-sm text-[#2D2D2D] text-center">
                Инструмент для бизнеса: без доставки, без оплат, только быстрый
                расчёт габаритов по фото.
              </p>
            </div>
          </div>
        </section>

        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-16">
          <div className="w-full max-w-[1128px] flex flex-col gap-6 md:gap-8">
            <h2 className="text-2xl md:text-[40px] font-bold text-[#2D2D2D] text-center">
              Как это работает
            </h2>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start justify-center">
              <div className="pt-0 md:pt-6">
                <div className="w-full md:w-[340px] bg-[rgba(0,119,254,0.16)] rounded-2xl p-6 flex text-center items-center justify-between flex-col gap-6 md:-rotate-3">
                  <div className="w-10 h-10 rounded-full bg-[#0077FE] flex items-center justify-center text-lg font-bold text-white">
                    1
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D]">
                    Войдите по коду
                  </h3>
                  <p className="text-sm text-[#2D2D2D]">
                    Телефон + код, без пароля. При первом входе аккаунт
                    создаётся автоматически.
                  </p>
                </div>
              </div>

              <div>
                <div className="w-full md:w-[312px] bg-[rgba(246,189,96,0.32)] items-center justify-between text-center rounded-2xl p-6 flex flex-col gap-6">
                  <div className="w-10 h-10 rounded-full bg-[#F6BD60] flex items-center justify-center text-lg font-bold text-[#2D2D2D]">
                    2
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D]">
                    Загрузите 1–3 фото
                  </h3>
                  <p className="text-sm text-[#2D2D2D]">
                    Подходит для быстрого уточнения размеров, когда нет точных
                    данных от поставщика.
                  </p>
                </div>
              </div>

              <div className="pt-0 md:pt-6">
                <div className="w-full md:w-[340px] bg-[rgba(87,167,115,0.24)] items-center justify-between text-center rounded-2xl p-6 flex flex-col gap-6 md:rotate-3">
                  <div className="w-10 h-10 rounded-full bg-[#57A773] flex items-center justify-center text-lg font-bold text-white">
                    3
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D]">
                    Получите и отправьте результат
                  </h3>
                  <p className="text-sm text-[#2D2D2D]">
                    Скопируйте габариты или поделитесь текстом результата в один
                    клик.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full flex justify-center px-4 md:px-6 pb-8 md:pb-16">
          <div className="w-full max-w-[1128px] grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-xl font-bold text-[#2D2D2D]">
                Фиксация событий
              </h3>
              <p className="text-sm text-[#2D2D2D]">
                Просмотр страницы, вход, загрузка фото, успех/ошибка расчёта,
                копирование и шаринг логируются в analytics.
              </p>
            </div>
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-xl font-bold text-[#2D2D2D]">
                7 дней теста
              </h3>
              <p className="text-sm text-[#2D2D2D]">
                Новый пользователь получает тестовый период автоматически,
                без оплаты и без привязки карты.
              </p>
            </div>
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
              <h3 className="text-xl font-bold text-[#2D2D2D]">
                Только инструмент
              </h3>
              <p className="text-sm text-[#2D2D2D]">
                В MVP нет доставки, ТК, оформления заказов и оплат. Только
                расчёт габаритов по фото для бизнес-задач.
              </p>
            </div>
          </div>
        </section>

        <footer className="w-full flex justify-center px-4 md:px-6 py-8 md:py-12 mt-auto">
          <div className="w-full max-w-[1128px] flex flex-col gap-6 md:gap-8">
            <div className="w-full overflow-hidden">
              <img src={logosStrip} alt="" className="w-full h-auto" />
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6">
              <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
              <div className="hidden md:flex items-center gap-1">
                <img src={iconVerify} alt="" className="w-6 h-6" />
                <span className="text-xs text-[#2D2D2D]">
                  Агрегатор транспортных компаний
                </span>
              </div>

              <div className="md:ml-auto bg-white border border-[#C8C7CC] rounded-xl p-2 flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                <img src={qrCode} alt="QR" className="w-12 h-12" />
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-semibold text-[#2D2D2D]">
                    @pochtahub_bot
                  </span>
                  <span className="text-xs text-[#858585]">Наш телеграм бот</span>
                </div>
                <img src={iconTelegram} alt="" className="w-6 h-6" />
              </div>

              <button
                onClick={handleCtaClick}
                className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-[#0077FE] text-white"
              >
                Войти и рассчитать
              </button>
            </div>

            <div className="pt-6 border-t border-[#C8C7CC] flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-[#2D2D2D]">
                  PochtaHub Business
                </span>
                <span className="text-xs text-[#858585]">
                  Закрытый инструмент для расчёта габаритов по фото
                </span>
              </div>
              <div
                className="md:ml-auto flex items-center gap-2 cursor-pointer hover:bg-[#F4EEE2] rounded-lg px-3 py-2 transition-colors w-fit"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                <span className="text-sm text-[#2D2D2D]">Наверх</span>
                <div className="w-8 h-8 rounded-full bg-[#F4F2F3] flex items-center justify-center text-base hover:bg-[#0077FE] hover:text-white transition-colors">
                  ↑
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default BusinessPage;
