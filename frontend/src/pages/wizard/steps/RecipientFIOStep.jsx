import { isValidFullName } from "../../../utils/validation";

function RecipientFIOStep({
  recipientFIO,
  onRecipientFIOChange,
  recipientFioFocused,
  onRecipientFioFocus,
  onRecipientFioBlur,
  onContinue,
}) {
  const isFioValid = isValidFullName(recipientFIO);
  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Укажите ваши данные
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        ФИО необходимо для получения посылки
      </p>
      <div className="mb-6">
        <div className="relative">
          <div
            className={`relative border rounded-xl ${
              recipientFioFocused ? "border-[#0077FE]" : "border-[#C8C7CC]"
            }`}
          >
            <input
              type="text"
              value={recipientFIO}
              onChange={onRecipientFIOChange}
              onFocus={onRecipientFioFocus}
              onBlur={onRecipientFioBlur}
              placeholder=" "
              className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
            />
            <label
              className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                recipientFIO || recipientFioFocused
                  ? "top-2 text-xs"
                  : "top-1/2 -translate-y-1/2 text-base"
              } ${recipientFioFocused ? "text-[#0077FE]" : "text-[#858585]"}`}
            >
              ФИО
            </label>
          </div>
        </div>
        {recipientFIO?.trim() && !isFioValid && (
          <p className="text-sm text-red-500 mt-2">
            Укажите как минимум имя и фамилию
          </p>
        )}
      </div>
      <button
        onClick={onContinue}
        disabled={!isFioValid}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  );
}

export default RecipientFIOStep;
