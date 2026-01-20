import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import CityInput from "../components/CityInput";
import CityForm from "../components/CityForm";
import PhoneInput from "../components/PhoneInput";
import CodeInput from "../components/CodeInput";
import { authAPI } from "../api";

import logoSvg from "../assets/images/logo.svg";
import iconTelegram from "../assets/images/icon-telegram.svg";
import iconArrowRight from "../assets/images/icon-arrow-right.svg";
import iconVerify from "../assets/images/icon-verify.svg";
import heroConcept from "../assets/images/hero-concept.svg";
import logosStrip from "../assets/images/logos-strip.svg";
import iconCheckCircle from "../assets/images/icon-check-circle.svg";
import aboutPic from "../assets/images/about_pic.png";
import qrCode from "../assets/images/qr-code.jpg";

function CalculatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const fromCityInputRef = useRef(null);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [phone, setPhone] = useState("");
  const [smsCode, setSmsCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("access_token"),
  );

  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem("access_token"));
    };

    checkAuth();

    const handleStorageChange = (e) => {
      if (e.key === "access_token" || !e.key) {
        checkAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("focus", checkAuth);

    const handleCustomAuthChange = () => checkAuth();
    window.addEventListener("authChange", handleCustomAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", checkAuth);
      window.removeEventListener("authChange", handleCustomAuthChange);
    };
  }, []);

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"));
  }, [location.pathname]);

  const handleSendCode = async (method = "telegram") => {
    if (!phone) {
      setCodeError("Введите номер телефона");
      return;
    }
    setCodeLoading(true);
    setCodeError("");
    setTelegramSent(false);
    try {
      const response = await authAPI.sendCode(phone, method);
      if (response.data?.success || response.data?.telegram_sent) {
        if (response.data?.telegram_sent) {
          setTelegramSent(true);
        }
        setCodeSent(true);
      } else {
        setCodeError(response.data?.error || "Ошибка отправки кода");
      }
    } catch (err) {
      const errorData = err.response?.data;
      setCodeError(errorData?.error || err.message || "Ошибка отправки кода");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleSendSmsCode = async () => {
    await handleSendCode("sms");
  };

  const handleVerifyCode = async (code = null) => {
    const codeToVerify = code || smsCode;
    if (!codeToVerify || codeToVerify.length !== 4) {
      setCodeError("Введите код");
      return;
    }
    setVerifyLoading(true);
    setCodeError("");
    try {
      console.log(
        "🔐 [CalculatePage] Начало верификации кода для телефона:",
        phone,
      );
      const response = await authAPI.verifyCode(phone, codeToVerify);
      console.log(
        "🔐 [CalculatePage] Ответ от API верификации:",
        response.data,
      );
      if (response.data && response.data.tokens) {
        console.log("✅ [CalculatePage] Токены получены:", {
          access: response.data.tokens.access ? "есть" : "нет",
          refresh: response.data.tokens.refresh ? "есть" : "нет",
        });
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        const savedToken = localStorage.getItem("access_token");
        console.log(
          "💾 [CalculatePage] Токен сохранен в localStorage:",
          savedToken ? "ДА (длина: " + savedToken.length + ")" : "НЕТ",
        );
        setIsAuthenticated(true);
        window.dispatchEvent(new CustomEvent("authChange"));
        setShowLoginPopup(false);
        setPhone("");
        setSmsCode("");
        setCodeSent(false);
      } else if (response.data && !response.data.user_exists) {
        setCodeError("Пользователь не найден. Пожалуйста, зарегистрируйтесь.");
      }
    } catch (err) {
      setCodeError(err.response?.data?.error || err.message || "Неверный код");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = () => {
    setSmsCode("");
    setCodeError("");
    setTelegramSent(false);
    setCodeSent(false);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    if (!fromCity || !toCity) {
      alert("Заполните поля откуда и куда");
      return;
    }

    const existingWizardData = location?.state?.wizardData || {};
    const wizardData = {
      fromCity,
      toCity,
      weight: "0.1",
      length: "23",
      width: "16",
      height: "2",
      senderAddress: fromCity,
      deliveryAddress: toCity,
      filterCourierPickup: existingWizardData.filterCourierPickup,
      filterCourierDelivery: existingWizardData.filterCourierDelivery,
    };

    navigate("/offers", {
      state: {
        wizardData,
      },
    });
  };

  const handleCalculateClick = () => {
    if (!fromCity || !toCity) {
      alert("Заполните поля откуда и куда");
      return;
    }
    if (typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(104664178, "reachGoal", "расчет");
    }
    navigate("/wizard", {
      state: {
        fromCity,
        toCity,
      },
    });
  };

  const handleRecipientDelivery = () => {
    // Находим форму hero (первая форма на странице)
    const heroForm = document.querySelector("form");
    if (heroForm) {
      heroForm.scrollIntoView({ behavior: "smooth", block: "center" });
      // Небольшая задержка чтобы скролл завершился перед установкой фокуса
      setTimeout(() => {
        if (fromCityInputRef.current) {
          fromCityInputRef.current.focus();
        }
      }, 800);
    }
  };

  return (
    <>
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-[420px] w-full relative">
            <button
              onClick={() => {
                setShowLoginPopup(false);
                setPhone("");
                setSmsCode("");
                setCodeSent(false);
                setCodeError("");
                setTelegramSent(false);
              }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#2D2D2D] hover:bg-[#F5F5F5] rounded-full transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>

            <div className="p-8">
              <h2 className="text-3xl font-bold text-[#2D2D2D] mb-2 text-center">
                Вход в профиль
              </h2>
              <p className="text-base text-center text-[#2D2D2D] mb-6">
                {!codeSent
                  ? "Введите номер телефона, код будет отправлен в Telegram"
                  : telegramSent
                    ? "Введите код из Telegram"
                    : "Введите код из SMS"}
              </p>

              {!codeSent ? (
                <>
                  <div className="mb-6">
                    <PhoneInput
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      label="Телефон"
                    />
                  </div>
                  {codeError && (
                    <div className="mb-4">
                      <p className="text-sm text-red-500 text-center mb-2">
                        {codeError}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={() => handleSendCode("telegram")}
                    disabled={codeLoading || !phone}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {codeLoading ? "Отправка..." : "Получить код в Telegram"}
                  </button>
                  <button
                    onClick={handleSendSmsCode}
                    disabled={codeLoading || !phone}
                    className="w-full bg-[#F5F5F5] text-[#2D2D2D] px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#E5E5E5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
                  >
                    {codeLoading ? "Отправка..." : "Отправить SMS"}
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <CodeInput
                      value={smsCode}
                      onChange={(e) => setSmsCode(e.target.value)}
                      onComplete={(code) => {
                        setSmsCode(code);
                        if (code && code.length === 4) {
                          handleVerifyCode(code);
                        }
                      }}
                    />
                  </div>
                  {codeError && (
                    <div className="mb-4">
                      <p className="text-sm text-red-500 text-center mb-2">
                        {codeError}
                      </p>
                    </div>
                  )}
                  {telegramSent && (
                    <p className="text-sm text-green-600 mb-4 text-center">
                      Код отправлен в Telegram
                    </p>
                  )}
                  {!telegramSent && codeSent && (
                    <p className="text-sm text-[#858585] mb-4 text-center">
                      Код отправлен в SMS
                    </p>
                  )}
                  <div className="flex flex-col gap-3 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false);
                        setSmsCode("");
                        setCodeError("");
                        setTelegramAvailable(false);
                        setTelegramSent(false);
                      }}
                      className="text-sm text-[#0077FE] hover:underline text-center"
                    >
                      Изменить номер
                    </button>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={codeLoading}
                      className="text-sm text-[#858585] hover:text-[#2D2D2D] disabled:opacity-50 text-center"
                    >
                      Отправить код заново
                    </button>
                  </div>
                  <button
                    onClick={() => handleVerifyCode()}
                    disabled={verifyLoading || !smsCode || smsCode.length !== 4}
                    className="w-full bg-[#0077FE] text-white px-6 py-4 rounded-xl text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verifyLoading ? "Проверка..." : "Продолжить"}
                  </button>
                </>
              )}

              <p className="text-xs text-center text-[#858585] mt-6">
                Авторизуясь, вы соглашаетесь{" "}
                <a href="#" className="text-[#0077FE] hover:underline">
                  с Пользовательским соглашением
                </a>{" "}
                и{" "}
                <a href="#" className="text-[#0077FE] hover:underline">
                  Политикой конфиденциальности
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center bg-white">
        {/* TopLine */}
        <div className="w-full bg-[#ADD3FF] flex justify-center cursor-pointer">
          <div className="w-full max-w-[1128px] px-6 py-2 flex items-center justify-center gap-3">
            <img src={iconTelegram} alt="" className="w-6 h-6" />
            <span className="text-sm font-semibold text-[#2D2D2D]">
              Еще быстрее и удобнее отправить посылку в нашем Telegram-боте
            </span>
            <img src={iconArrowRight} alt="" className="w-6 h-6" />
          </div>
        </div>

        {/* Header */}
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
                  to="/cabinet"
                  className="hidden md:inline-block px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                >
                  Личный кабинет
                </Link>
              ) : (
                <button
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      typeof window.ym === "function"
                    ) {
                      window.ym(104664178, "params", { glavnaya: "вход" });
                    }
                    setShowLoginPopup(true);
                  }}
                  className="hidden md:inline-block px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                >
                  Войти
                </button>
              )}
              <button className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-[#0077FE] text-white">
                Рассчитать
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          id="calculate-form"
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
            <div className="bg-[#F9F6F0] px-4 md:px-[72px] py-6 md:py-0 flex flex-col md:flex-row items-center md:pb-0 pb-0 md:items-end justify-center gap-6 md:gap-8">
              <div className="flex-1 flex flex-col justify-center gap-4 md:gap-6 py-6 md:py-12">
                <h1 className="text-2xl md:text-[48px] font-bold leading-[1.25] text-[#2D2D2D] text-center md:text-left">
                  Сфотографируй посылку —<br />
                  мы всё сделаем
                </h1>
                <p className="text-sm md:text-base leading-[1.5] text-[#2D2D2D] text-center md:text-left">
                  Получатель тоже может начать отправку
                  <br />
                  Если вы ждёте посылку — оформите доставку сами.
                  <br />
                  Мы свяжемся с отправителем и всё сделаем.
                </p>
              </div>
              <div className="shrink-0 flex items-center justify-center">
                <img
                  src={heroConcept}
                  alt=""
                  className="h-[200px] md:h-[428px] w-auto"
                />
              </div>
            </div>
            <CityForm
              fromCity={fromCity}
              toCity={toCity}
              onFromCityChange={(e) => setFromCity(e.target.value)}
              onToCityChange={(e) => setToCity(e.target.value)}
              onSubmit={handleCalculate}
              buttonText="Рассчитать и оформить"
              variant="hero"
              fromCityInputRef={fromCityInputRef}
            />
            <div className="bg-[#F9F6F0] px-6 py-4 flex items-center justify-center rounded-b-2xl">
              <p className="text-sm text-[#2D2D2D]">
                Начать оформление может как отправитель, так и получатель
              </p>
            </div>
          </div>
        </section>

        {/* How */}
        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-16">
          <div className="w-full max-w-[1128px] flex flex-col gap-6 md:gap-8">
            <h2 className="text-2xl md:text-[40px] font-bold text-[#2D2D2D] text-center">
              Как это работает?
            </h2>
            <div className="flex flex-col gap-8 md:gap-12">
              <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-start justify-center">
                <div className="pt-0 md:pt-6">
                  <div className="w-full md:w-[340px] h-auto md:h-[380px] bg-[rgba(0,119,254,0.16)] rounded-2xl p-6 flex text-center items-center justify-between flex-col gap-6 -rotate-0 md:-rotate-3">
                    <div className="w-10 h-10 rounded-full bg-[#0077FE] flex items-center justify-center text-lg font-bold text-white">
                      1
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D]">
                      Сфотографируйте посылку или введите маршрут
                    </h3>
                    <p className="text-sm text-[#2D2D2D]">
                      Начать может и отправитель, и получатель
                    </p>
                  </div>
                </div>
                <div className="">
                  <div className="w-full md:w-[312px] h-auto md:h-[348px] bg-[rgba(246,189,96,0.32)] items-center justify-between text-center rounded-2xl p-6 flex flex-col gap-6">
                    <div className="w-10 h-10 rounded-full bg-[#F6BD60] flex items-center justify-center text-lg font-bold text-[#2D2D2D]">
                      2
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D]">
                      Мы сравним варианты доставки
                    </h3>
                    <p className="text-sm text-[#2D2D2D]">
                      Сразу по нескольким транспортным компаниям
                    </p>
                  </div>
                </div>
                <div className="pt-0 md:pt-6">
                  <div className="w-full md:w-[340px] h-auto md:h-[380px] bg-[rgba(87,167,115,0.24)] items-center justify-between text-center rounded-2xl p-6 flex flex-col gap-6 rotate-0 md:rotate-3">
                    <div className="w-10 h-10 rounded-full bg-[#57A773] flex items-center justify-center text-lg font-bold text-white">
                      3
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-[#2D2D2D]">
                      Отправитель передаст посылку курьеру или сдаст в ближайший
                      пункт приёма
                    </h3>
                    <p className="text-sm text-[#2D2D2D]">
                      Получатель выбирает и оплачивает удобный вариант
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center gap-4 md:gap-6">
                <p className="text-base md:text-lg font-bold text-[#2D2D2D] text-center px-4">
                  Рассчитайте стоимость и сроки посылки за несколько минут
                  <br className="hidden md:block" />
                  сразу во всех транспортных компаниях
                </p>
                <CityForm
                  fromCity={fromCity}
                  toCity={toCity}
                  onFromCityChange={(e) => setFromCity(e.target.value)}
                  onToCityChange={(e) => setToCity(e.target.value)}
                  onSubmit={handleCalculate}
                  buttonText="Рассчитать и оформить"
                  variant="default"
                />
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-16">
          <div className="w-full max-w-[1128px] relative">
            <div className="bg-[#F4EEE2] rounded-2xl p-6 md:p-12 flex flex-col md:flex-row">
              <div className="flex-1 flex flex-col gap-4 md:gap-6">
                <div className="flex flex-col gap-3 md:gap-4">
                  <h2 className="text-2xl md:text-[40px] font-bold text-[#2D2D2D] leading-[1.1]">
                    PochtaHub — просто отправить. Удобно получить
                  </h2>
                  <div className="flex flex-col gap-2 md:gap-3 text-sm md:text-base text-[#2D2D2D] max-w-full md:max-w-[400px]">
                    <p>
                      <span className="font-semibold">Отправителю</span> не
                      нужно разбираться в доставке — он просто передаёт посылку
                      курьеру или сдаёт её в пункт приёма.
                    </p>
                    <p>
                      <span className="font-semibold">Получатель</span> сам
                      выбирает транспортную компанию, сроки и стоимость, и
                      оплачивает доставку онлайн.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRecipientDelivery}
                  className="w-full md:w-fit px-6 py-4 rounded-[10px] text-base font-semibold bg-[#0077FE] text-white"
                >
                  Я получатель — хочу оформить доставку
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center mt-6 md:mt-0">
                <img
                  src={aboutPic}
                  alt=""
                  className="max-w-full h-auto md:absolute md:right-[85px] md:bottom-0"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bullets */}
        <section className="w-full flex justify-center px-4 md:px-6 py-8 md:py-16">
          <div className="w-full max-w-[1128px] grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F2F3] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#0077FE]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2D2D2D]">
                Все варианты доставки в одном месте
              </h3>
              <div className="flex flex-col gap-2 text-sm text-[#2D2D2D]">
                <p>
                  Сравните стоимость и сроки сразу по нескольким транспортным
                  компаниям.
                </p>
                <p>
                  Без перехода на сайты, без ручного поиска — всё в одном месте.
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F2F3] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#0077FE]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2D2D2D]">
                Сервис для отправителя и получателя
              </h3>
              <div className="flex flex-col gap-2 text-sm text-[#2D2D2D]">
                <p>Начать отправку может любой: и отправитель, и получатель.</p>
                <p>
                  Мы сами свяжемся со второй стороной и поможем всё оформить —
                  удобно и без неловких диалогов.
                </p>
              </div>
            </div>
            <div className="bg-white border border-[#C8C7CC] rounded-2xl p-6 flex flex-col gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F2F3] flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-[#0077FE]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#2D2D2D]">
                Никакой головной боли и лучшая цена
              </h3>
              <div className="flex flex-col gap-2 text-sm text-[#2D2D2D]">
                <p>
                  Мы автоматизировали всё оформление: расчёты, выбор ТК,
                  документы и передачу посылки.
                </p>
                <p>
                  Не нужно ходить по сайтам или стоять в очередях — всё за пару
                  минут онлайн.
                </p>
                <p>Стоимость сервиса — всего 50 Р.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full flex justify-center px-4 md:px-6 py-8 md:py-12 mt-auto">
          <div className="w-full max-w-[1128px] flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col gap-4 md:gap-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
                <a
                  href="#calculate-form"
                  className="text-sm text-[#2D2D2D] hover:text-[#0077FE] transition-colors"
                >
                  Рассчитать доставку
                </a>
                <div className="hidden md:block w-px h-4 bg-[#C8C7CC]"></div>
                <a
                  href="https://t.me/pochtahub_bot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#2D2D2D] hover:text-[#0077FE] transition-colors"
                >
                  Рассчитать в Telegram-боте
                </a>
              </div>
              <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-[#2D2D2D]">CDEK</span>
                  <span className="text-sm text-[#2D2D2D]">Деловые Линии</span>
                  <span className="text-sm text-[#2D2D2D]">DPD</span>
                  <span className="text-sm text-[#2D2D2D]">Энергия</span>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-[#2D2D2D]">KCE</span>
                  <span className="text-sm text-[#2D2D2D]">Почта России</span>
                  <span className="text-sm text-[#2D2D2D]">Байкал Сервис</span>
                  <span className="text-sm text-[#2D2D2D]">Boxberry</span>
                </div>
                <div className="md:ml-auto bg-white border border-[#C8C7CC] rounded-xl p-2 flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                  <img src={qrCode} alt="" className="w-12 h-12" />
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[#2D2D2D]">
                      @pochtahub_bot
                    </span>
                    <span className="text-xs text-[#858585]">
                      Наш телеграм бот
                    </span>
                  </div>
                  <img src={iconTelegram} alt="" className="w-6 h-6" />
                </div>
              </div>
            </div>
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
              <div className="ml-auto flex items-center gap-2">
                {isAuthenticated ? (
                  <Link
                    to="/cabinet"
                    className="hidden md:inline-block px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                  >
                    Личный кабинет
                  </Link>
                ) : (
                  <button
                    onClick={() => setShowLoginPopup(true)}
                    className="hidden md:inline-block px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]"
                  >
                    Войти
                  </button>
                )}
                <button className="px-3 md:px-4 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-[#0077FE] text-white">
                  Рассчитать
                </button>
              </div>
            </div>
            <div className="pt-6 border-t border-[#C8C7CC]">
              {/* Первая строка - основная информация */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 mb-6">
                <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-[#2D2D2D]">
                      PochtHub — агрегатор транспортных компаний
                    </span>
                    <a
                      href="#"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Стоимость услуг сервиса PochtHub — 30 ₽.
                    </a>
                    <a
                      href="#"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Стоимость доставки зависит от условий выбранной
                      транспортной компании и указывается при оформлении заказа.
                    </a>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <span className="text-xs text-[#858585]">
                      Самозанятый Кудрявцев Алексей Алексеевич
                    </span>
                    <span className="text-xs text-[#858585]">
                      ИНН: 636702832454
                    </span>
                    <a
                      href="mailto:info@pochtahub.ru"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Email: info@pochtahub.ru
                    </a>
                    <a
                      href="mailto:support@pochtahub.ru"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Поддержка: support@pochtahub.ru
                    </a>
                    <a
                      href="tel:+79277272680"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Телефон: +7 (927) 727-26-80
                    </a>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-[#858585]">
                      Онлайн-оплата осуществляется с использованием платёжного
                      сервиса ЮKassa
                    </span>
                    <span className="text-xs text-[#858585]">
                      VISA · MasterCard · МИР · СБП
                    </span>
                  </div>
                </div>
              </div>
              {/* Вторая строка - ссылки и наверх */}
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-start lg:items-center">
                <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                  <div className="flex flex-col gap-2">
                    <a
                      href="/pochtahub.ru:privacy.docx"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Политика конфиденциальности
                    </a>
                    <a
                      href="/pochtahub.ru:terms.docx"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Публичная оферта / Пользовательское соглашение
                    </a>
                    <a
                      href="/pochtahub.ru:privacy.docx"
                      className="text-xs text-[#858585] hover:text-[#0077FE] transition-colors"
                    >
                      Политика cookie
                    </a>
                  </div>
                </div>
                <div
                  className="lg:ml-auto flex items-center gap-2 cursor-pointer justify-center lg:justify-start hover:bg-[#F4EEE2] rounded-lg px-3 py-2 transition-colors"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <span className="text-sm text-[#2D2D2D]">Наверх</span>
                  <div className="w-8 h-8 rounded-full bg-[#F4F2F3] flex items-center justify-center text-base hover:bg-[#0077FE] hover:text-white transition-colors">
                    ↑
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export default CalculatePage;
