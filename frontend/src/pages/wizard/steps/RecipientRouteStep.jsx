import CityInput from "../../../components/CityInput";

function RecipientRouteStep({
  fromCity,
  toCity,
  onFromCityChange,
  onToCityChange,
  onContinue,
}) {
  const isDisabled = !fromCity?.trim() || !toCity?.trim();

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Откуда и куда доставить посылку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Укажите город отправителя и город получателя
      </p>

      <div className="space-y-4 mb-6">
        <div className="border border-[#C8C7CC] rounded-xl">
          <CityInput
            value={fromCity}
            onChange={onFromCityChange}
            label="Город отправителя"
          />
        </div>
        <div className="border border-[#C8C7CC] rounded-xl">
          <CityInput
            value={toCity}
            onChange={onToCityChange}
            label="Город получателя"
          />
        </div>
      </div>

      <button
        onClick={() => {
          if (
            typeof window !== "undefined" &&
            typeof window.ym === "function"
          ) {
            window.ym(104664178, "params", { offers: "рассчитал" });
          }
          onContinue();
        }}
        disabled={isDisabled}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold hover:bg-[#0066CC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Продолжить
      </button>
    </div>
  );
}

export default RecipientRouteStep;
