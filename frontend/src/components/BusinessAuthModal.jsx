import { useState } from "react";

import { authAPI } from "../api";
import CodeInput from "./CodeInput";
import PhoneInput from "./PhoneInput";

function BusinessAuthModal({ isOpen, onClose, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) {
    return null;
  }

  const resetState = () => {
    setPhone("");
    setCode("");
    setCodeSent(false);
    setCodeLoading(false);
    setVerifyLoading(false);
    setTelegramSent(false);
    setError("");
  };

  const handleClose = () => {
    resetState();
    onClose?.();
  };

  const handleSendCode = async (method = "telegram") => {
    if (!phone) {
      setError("Введите номер телефона");
      return;
    }

    setCodeLoading(true);
    setError("");

    try {
      const response = await authAPI.sendCode(phone, method);
      if (response.data?.success || response.data?.telegram_sent) {
        setCodeSent(true);
        setTelegramSent(Boolean(response.data?.telegram_sent));
      } else {
        setError(response.data?.error || "Не удалось отправить код");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Не удалось отправить код");
    } finally {
      setCodeLoading(false);
    }
  };

  const handleVerifyCode = async (value = null) => {
    const nextCode = value ?? code;
    if (!nextCode || nextCode.length !== 4) {
      setError("Введите код из 4 цифр");
      return;
    }

    setVerifyLoading(true);
    setError("");

    try {
      const response = await authAPI.verifyCode(phone, nextCode);
      if (response.data?.tokens?.access && response.data?.tokens?.refresh) {
        localStorage.setItem("access_token", response.data.tokens.access);
        localStorage.setItem("refresh_token", response.data.tokens.refresh);
        window.dispatchEvent(new CustomEvent("authChange"));

        await onSuccess?.(response.data?.user);
        handleClose();
      } else {
        setError("Не удалось выполнить вход");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Неверный код");
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 p-4 flex items-center justify-center">
      <div className="relative w-full max-w-[460px] rounded-3xl bg-white border border-[#E7E7E7] p-8 shadow-[0_28px_70px_rgba(14,44,89,0.25)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 h-9 w-9 rounded-full bg-[#F5F5F5] text-[#2D2D2D] text-xl leading-none"
          aria-label="Закрыть"
        >
          ×
        </button>

        <h2 className="text-[28px] leading-[34px] font-bold text-[#2D2D2D]">
          Вход в Business
        </h2>
        <p className="mt-2 text-sm text-[#5E6472]">
          {!codeSent
            ? "Введите номер телефона, отправим код для входа без пароля."
            : telegramSent
              ? "Введите код из Telegram."
              : "Введите код из SMS."}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-[#F5B9B9] bg-[#FFF3F3] px-4 py-3 text-sm text-[#B42318]">
            {error}
          </div>
        )}

        {!codeSent ? (
          <div className="mt-6 space-y-4">
            <PhoneInput
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              label="Телефон"
              required
            />
            <button
              type="button"
              onClick={() => handleSendCode("telegram")}
              disabled={codeLoading || !phone}
              className="w-full rounded-xl bg-[#0077FE] py-4 text-base font-semibold text-white disabled:opacity-60"
            >
              {codeLoading ? "Отправка..." : "Код в Telegram"}
            </button>
            <button
              type="button"
              onClick={() => handleSendCode("sms")}
              disabled={codeLoading || !phone}
              className="w-full rounded-xl border border-[#C8C7CC] bg-white py-4 text-base font-semibold text-[#2D2D2D] disabled:opacity-60"
            >
              {codeLoading ? "Отправка..." : "Код по SMS"}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            <CodeInput
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onComplete={(value) => handleVerifyCode(value)}
            />
            <button
              type="button"
              onClick={() => handleVerifyCode()}
              disabled={verifyLoading}
              className="w-full rounded-xl bg-[#0077FE] py-4 text-base font-semibold text-white disabled:opacity-60"
            >
              {verifyLoading ? "Проверяем..." : "Войти"}
            </button>
            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setError("");
                setTelegramSent(false);
              }}
              className="w-full text-sm text-[#6E7683]"
            >
              Изменить номер
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default BusinessAuthModal;

