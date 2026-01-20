import PhoneInput from "../../../components/PhoneInput";

function RecipientPhoneStep({
  recipientPhone,
  onRecipientPhoneChange,
  onContinue,
}) {
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Укажите телефон получателя
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Нужен для уведомлений и связи при доставке.
      </p>
      <div className="mb-6">
        <PhoneInput
          value={recipientPhone}
          onChange={onRecipientPhoneChange}
          label="Телефон получателя"
        />
      </div>
      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            typeof window.ym === "function"
          ) {
            window.ym(104664178, "reachGoal", "указал_телефон_получателя");
          }
          onContinue();
        }}
        disabled={!recipientPhone}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  );
}

export default RecipientPhoneStep;
