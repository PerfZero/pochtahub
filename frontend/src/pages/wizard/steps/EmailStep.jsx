function EmailStep({
  email,
  onEmailChange,
  emailFocused,
  onEmailFocus,
  onEmailBlur,
  agreePersonalData,
  onAgreePersonalDataChange,
  agreeMarketing,
  onAgreeMarketingChange,
  loadingOffers,
  onContinue,
}) {
  // Валидация email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isEmailValid = email ? validateEmail(email) : false;
  const showEmailError = email && !isEmailValid;

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Укажите ваш электронный адрес
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        По нему вы сможете авторизоваться, чтобы отслеживать статус доставки
      </p>
      <div className="mb-6">
        <div className="relative">
          <div
            className={`relative border rounded-xl ${
              showEmailError
                ? "border-red-500"
                : emailFocused
                  ? "border-[#0077FE]"
                  : "border-[#C8C7CC]"
            }`}
          >
            <input
              type="email"
              value={email}
              onChange={onEmailChange}
              onFocus={onEmailFocus}
              onBlur={onEmailBlur}
              placeholder=" "
              className={`w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base focus:outline-none ${
                showEmailError ? "text-red-500" : "text-[#2D2D2D]"
              }`}
            />
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                email || emailFocused
                  ? "top-2 text-xs"
                  : "top-1/2 -translate-y-1/2 text-base"
              } ${showEmailError ? "text-red-500" : emailFocused ? "text-[#0077FE]" : "text-[#858585]"}`}
            >
              Электронный адрес
            </label>
          </div>
          {showEmailError && (
            <p className="mt-2 text-sm text-red-500">
              Введите корректный email адрес (например: example@mail.com)
            </p>
          )}
        </div>
      </div>
      <div className="mb-6 space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreePersonalData}
            onChange={onAgreePersonalDataChange}
            className="mt-1 w-5 h-5 rounded border-[#C8C7CC] text-[#0077FE] focus:ring-[#0077FE]"
          />
          <span className="text-sm text-[#2D2D2D]">
            Нажимая кнопку «Продолжить», вы соглашаетесь с{" "}
            <a
              href="/pochtahub.ru:privacy.docx"
              className="text-[#0077FE] hover:underline"
            >
              Политикой конфиденциальности
            </a>
          </span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreeMarketing}
            onChange={onAgreeMarketingChange}
            className="mt-1 w-5 h-5 rounded border-[#C8C7CC] text-[#0077FE] focus:ring-[#0077FE]"
          />
          <span className="text-sm text-[#2D2D2D]">
            Я согласен получать информационные сообщения от PochtHub (можно
            отказаться в любой момент)
          </span>
        </label>
      </div>
      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            typeof window.ym === "function"
          ) {
            window.ym(104664178, "params", { offers: "указал_мыло" });
          }
          onContinue();
        }}
        disabled={!isEmailValid || !agreePersonalData || loadingOffers}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingOffers ? "Загрузка..." : "Продолжить"}
      </button>
    </div>
  );
}

export default EmailStep;
