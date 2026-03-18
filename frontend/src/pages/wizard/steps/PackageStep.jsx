import NumberInput from "../../../components/NumberInput";
import iconPhone from "../../../assets/images/icon-phone.svg";
import iconIron from "../../../assets/images/icon-iron.svg";
import iconShoes from "../../../assets/images/icon-shoes.svg";
import iconMicrowave from "../../../assets/images/icon-microwave.svg";

const sizeOptions = [
  {
    id: "smartphone",
    name: "Как коробка от смартфона",
    dimensions: "17х12х9 см",
    weight: "до 1 кг",
    icon: iconPhone,
  },
  {
    id: "iron",
    name: "Как коробка от утюга",
    dimensions: "21х20х11 см",
    weight: "до 3 кг",
    icon: iconIron,
  },
  {
    id: "shoes",
    name: "Как коробка от обуви",
    dimensions: "33х25х15 см",
    weight: "до 7 кг",
    icon: iconShoes,
  },
  {
    id: "microwave",
    name: "Как коробка от микроволновки",
    dimensions: "42х35х30 см",
    weight: "до 15кг",
    icon: iconMicrowave,
  },
];

function PackageStep({
  packageOption,
  onPackageOptionChange,
  photoPreview,
  photoError,
  photoAnalyzing,
  photoAnalysis,
  onPhotoChange,
  onPhotoRemove,
  length,
  onLengthChange,
  width,
  onWidthChange,
  height,
  onHeightChange,
  weight,
  onWeightChange,
  estimatedValue,
  onEstimatedValueChange,
  selectedSize,
  onSelectedSizeChange,
  onContinue,
}) {
  const isPhotoValid = packageOption === "photo" && Boolean(photoPreview);
  const isManualValid =
    packageOption === "manual" && Boolean(length && width && height && weight);
  const isUnknownValid = packageOption === "unknown" && Boolean(selectedSize);
  const isContinueDisabled =
    photoAnalyzing || !(isPhotoValid || isManualValid || isUnknownValid);
  const insuranceHint =
    "Нужно для расчета страховки. Укажите примерную стоимость содержимого.";
  const applySizePreset = (option) => {
    if (!option) {
      return;
    }

    const dimensionsMatch = option.dimensions.match(/(\d+)х(\d+)х(\d+)/);
    const weightMatch = option.weight.match(/(\d+)/);

    onSelectedSizeChange(option.id);
    if (dimensionsMatch) {
      onLengthChange({ target: { value: dimensionsMatch[1] } });
      onWidthChange({ target: { value: dimensionsMatch[2] } });
      onHeightChange({ target: { value: dimensionsMatch[3] } });
    }
    if (weightMatch) {
      onWeightChange({ target: { value: weightMatch[1] } });
    }
  };

  return (
    <>
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Расскажите о посылке
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Фото - лучший способ: мы сами определим размеры и подберём упаковку.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6">
        <button
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              typeof window.ym === "function"
            ) {
              window.ym(104664178, "params", { offers: "габарит_по_фото" });
            }
            onPackageOptionChange("photo");
          }}
          className={`p-4 md:p-6 rounded-xl border transition-all ${
            packageOption === "photo"
              ? "border-[#0077FE] bg-[#F0F7FF]"
              : "border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]"
          }`}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
              📸
            </div>
            <p className="text-sm md:text-base font-semibold text-[#2D2D2D] text-center">
              Сфотографировать посылку
            </p>
          </div>
        </button>

        <button
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              typeof window.ym === "function"
            ) {
              window.ym(104664178, "params", { offers: "габарит_указал" });
            }
            onPackageOptionChange("manual");
          }}
          className={`p-4 md:p-6 rounded-xl border transition-all ${
            packageOption === "manual"
              ? "border-[#0077FE] bg-[#F0F7FF]"
              : "border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]"
          }`}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
              ✏️
            </div>
            <p className="text-sm md:text-base font-semibold text-[#2D2D2D] text-center">
              Указать габариты вручную
            </p>
          </div>
        </button>
      </div>

      {packageOption === "photo" && (
        <div className="mb-8">
          <div className="border-2 border-dashed border-[#0077FE] rounded-xl p-4 md:p-8 mb-6">
            {!photoPreview ? (
              <div className="flex flex-col items-center gap-3 md:gap-4">
                <p className="text-xs md:text-sm text-[#2D2D2D] text-center">
                  Фотография весом не более 5 мб.
                </p>
                <input
                  type="file"
                  id="photo-upload"
                  accept="image/*"
                  onChange={onPhotoChange}
                  className="hidden"
                />
                <label
                  htmlFor="photo-upload"
                  className="px-6 py-3 bg-[#0077FE] text-white rounded-xl text-sm md:text-base font-semibold cursor-pointer hover:bg-[#0066CC] transition-colors"
                >
                  Загрузить фото
                </label>
                {photoError && (
                  <p className="text-sm text-red-500">{photoError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center w-full">
                <div className="relative inline-block ">
                  <img
                    src={photoPreview}
                    alt="Загруженное фото"
                    className="max-w-full h-auto rounded-lg max-h-48 md:max-h-64"
                  />
                  <button
                    onClick={onPhotoRemove}
                    className="absolute top-2 right-2 w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-[#2D2D2D] text-base md:text-lg font-bold">
                      ×
                    </span>
                  </button>
                </div>

                {photoAnalyzing && (
                  <div className="mt-3 md:mt-4 text-center">
                    <p className="text-xs md:text-sm text-[#0077FE]">
                      Анализируем изображение...
                    </p>
                  </div>
                )}

                {photoAnalysis && !photoAnalyzing && (
                  <div className="mt-4 w-full bg-[#F0F7FF] rounded-xl p-3 md:p-4 border border-[#0077FE]">
                    <h3 className="text-sm md:text-base font-semibold text-[#2D2D2D] mb-2 md:mb-3 text-center">
                      Результаты анализа
                    </h3>
                    <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3">
                      <div className="bg-white rounded-lg p-2 md:p-3">
                        <p className="text-xs text-[#666] mb-1">Длина</p>
                        <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                          {photoAnalysis.length
                            ? `${Math.round(photoAnalysis.length)} см`
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 md:p-3">
                        <p className="text-xs text-[#666] mb-1">Ширина</p>
                        <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                          {photoAnalysis.width
                            ? `${Math.round(photoAnalysis.width)} см`
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 md:p-3">
                        <p className="text-xs text-[#666] mb-1">Высота</p>
                        <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                          {photoAnalysis.height
                            ? `${Math.round(photoAnalysis.height)} см`
                            : "—"}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2 md:p-3">
                        <p className="text-xs text-[#666] mb-1">Вес</p>
                        <p className="text-sm md:text-base font-semibold text-[#2D2D2D]">
                          {photoAnalysis.weight
                            ? `${photoAnalysis.weight.toFixed(2)} кг`
                            : "—"}
                        </p>
                      </div>
                    </div>
                    {photoAnalysis.object_count > 0 && (
                      <div className="bg-white rounded-lg p-3 mb-3">
                        <p className="text-xs text-[#666] mb-1">
                          Обнаружено объектов: {photoAnalysis.object_count}
                        </p>
                        {photoAnalysis.object_names &&
                          photoAnalysis.object_names.length > 0 && (
                            <p className="text-sm text-[#2D2D2D]">
                              {photoAnalysis.object_names.join(", ")}
                            </p>
                          )}
                      </div>
                    )}
                    {photoAnalysis.declared_value > 0 && (
                      <div className="bg-white rounded-lg p-3">
                        <p className="text-xs text-[#666] mb-1">
                          Оценочная стоимость
                        </p>
                        <p className="text-base font-semibold text-[#2D2D2D]">
                          {Math.round(photoAnalysis.declared_value)} ₽
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-4 w-full">
                  <NumberInput
                    value={estimatedValue}
                    onChange={onEstimatedValueChange}
                    label="Оценочная стоимость"
                  />
                  <p className="text-xs text-[#858585] mt-2">{insuranceHint}</p>
                  {photoAnalysis?.declared_value > 0 && (
                    <p className="text-xs text-[#5F7EA6] mt-1">
                      Значение подставлено по фото, при необходимости измените
                      вручную.
                    </p>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <input
                    type="file"
                    id="photo-replace"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-replace"
                    className="text-sm text-[#0077FE] cursor-pointer hover:underline"
                  >
                    Загрузить другое фото
                  </label>
                </div>
                {photoError && (
                  <p className="text-sm text-red-500 mt-2 text-center">
                    {photoError}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onContinue}
            disabled={isContinueDisabled}
            className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Продолжить
          </button>
        </div>
      )}

      {packageOption === "manual" && (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4">
            <NumberInput
              value={length}
              onChange={onLengthChange}
              label="Длина, см"
            />
            <NumberInput
              value={width}
              onChange={onWidthChange}
              label="Ширина, см"
            />
            <NumberInput
              value={height}
              onChange={onHeightChange}
              label="Высота, см"
            />
            <NumberInput
              value={weight}
              onChange={onWeightChange}
              label="Вес, кг"
            />
          </div>
          <div className="mb-6">
            <NumberInput
              value={estimatedValue}
              onChange={onEstimatedValueChange}
              label="Оценочная стоимость"
            />
            <p className="text-xs text-[#858585] mt-2">{insuranceHint}</p>
          </div>
          <div className="mb-6">
            <p className="text-sm md:text-base font-semibold text-[#2D2D2D] mb-3">
              Шаблоны размеров
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {sizeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => applySizePreset(option)}
                  className={`p-3 md:p-4 rounded-xl border transition-all ${
                    selectedSize === option.id
                      ? "border-[#0077FE] bg-[#F0F7FF]"
                      : "border-[#E5E5E5] bg-white hover:border-[#0077FE]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2 md:gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                      <img src={option.icon} alt="" className="w-full h-full" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs md:text-sm font-semibold text-[#2D2D2D] mb-1">
                        {option.name}
                      </p>
                      <p className="text-xs text-[#2D2D2D]">
                        {option.dimensions}
                      </p>
                      <p className="text-xs text-[#2D2D2D]">{option.weight}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={onContinue}
            disabled={isContinueDisabled}
            className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Продолжить
          </button>
        </div>
      )}

      {packageOption === "unknown" && (
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
            {sizeOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => onSelectedSizeChange(option.id)}
                className={`p-3 md:p-4 rounded-xl border transition-all ${
                  selectedSize === option.id
                    ? "border-[#0077FE] bg-[#F0F7FF]"
                    : "border-[#E5E5E5] bg-white hover:border-[#0077FE]"
                }`}
              >
                <div className="flex flex-col items-center gap-2 md:gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center">
                    <img src={option.icon} alt="" className="w-full h-full" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs md:text-sm font-semibold text-[#2D2D2D] mb-1">
                      {option.name}
                    </p>
                    <p className="text-xs text-[#2D2D2D]">
                      {option.dimensions}
                    </p>
                    <p className="text-xs text-[#2D2D2D]">{option.weight}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="mb-6">
            <NumberInput
              value={estimatedValue}
              onChange={onEstimatedValueChange}
              label="Оценочная стоимость"
            />
            <p className="text-xs text-[#858585] mt-2">{insuranceHint}</p>
          </div>
          <button
            onClick={onContinue}
            disabled={isContinueDisabled}
            className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Продолжить
          </button>
        </div>
      )}
    </>
  );
}

export default PackageStep;
