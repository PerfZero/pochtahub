import PhoneInput from "../../../components/PhoneInput";
import CodeInput from "../../../components/CodeInput";

function ContactPhoneStep({
  phone,
  onPhoneChange,
  auth,
  selectedRole,
  title,
  description,
  onVerifyCode,
  onResendCode,
  allowSms = true,
  phoneLocked = false,
  onSendCode,
  onRoleChange,
  onContinue,
}) {
  const sendCode = onSendCode || ((method) => auth.handleSendCode(method));
  const shouldSkipCode = typeof onContinue === "function";

  if (!auth.codeSent || shouldSkipCode) {
    return (
      <div className="mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
          {title ||
            (selectedRole === "recipient"
              ? "Ваш телефон"
              : "Как с вами связаться?")}
        </h1>
        <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
          {description ||
            (selectedRole === "recipient"
              ? "Это необходимо для оформления заказа"
              : "Курьер позвонит перед приездом")}
        </p>
        <div className="mb-6">
          <PhoneInput
            value={phone}
            onChange={onPhoneChange}
            label="Ваш телефон"
            disabled={phoneLocked}
            readOnly={phoneLocked}
          />
          {phoneLocked && (
            <p className="text-xs text-[#858585] mt-2">
              Номер привязан к отправлению и недоступен для изменения.
            </p>
          )}
        </div>
        {auth.codeError && (
          <div className="mb-4">
            <p className="text-sm text-red-500 text-center mb-2">
              {auth.codeError}
            </p>
          </div>
        )}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => {
              if (
                typeof window !== "undefined" &&
                typeof window.ym === "function"
              ) {
                window.ym(104664178, "reachGoal", "указал_свой_телефон");
              }
              if (shouldSkipCode) {
                onContinue();
              } else {
                sendCode("sms");
              }
            }}
            disabled={auth.codeLoading || !phone}
            className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {auth.codeLoading ? "Отправка..." : "Продолжить"}
          </button>
          <p className="text-xs md:text-sm text-[#858585]">Код придёт в SMS</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        {auth.telegramSent ? "Введите код из Telegram" : "Введите код из СМС"}
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        {auth.telegramSent ? (
          <>
            Отправили в <strong>Telegram</strong>
          </>
        ) : (
          <>
            Отправили на <strong>{phone}</strong>
          </>
        )}
      </p>
      <div className="mb-6">
        <CodeInput
          value={auth.smsCode}
          onChange={(e) => auth.setSmsCode(e.target.value)}
          onComplete={(code) => {
            auth.setSmsCode(code);
            if (code && code.length === 4) {
              onVerifyCode(code);
            }
          }}
        />
      </div>
      {auth.codeError && (
        <div className="mb-4">
          <p className="text-sm text-red-500 text-center mb-2">
            {auth.codeError}
          </p>
        </div>
      )}
      {auth.telegramSent && (
        <p className="text-sm text-green-600 mb-4 text-center">
          Код отправлен в Telegram
        </p>
      )}
      <div className="flex flex-col gap-3">
        {!phoneLocked && (
          <button
            type="button"
            onClick={() => {
              auth.resetCodeState();
            }}
            className="text-sm text-[#0077FE] hover:underline"
          >
            Изменить номер
          </button>
        )}
        {onResendCode && (
          <button
            type="button"
            onClick={onResendCode}
            disabled={auth.codeLoading}
            className="text-sm text-[#858585] hover:text-[#2D2D2D] disabled:opacity-50"
          >
            Получить новый код
          </button>
        )}
      </div>
    </div>
  );
}

export default ContactPhoneStep;
