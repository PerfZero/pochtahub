function RoleSelectStep({ onRoleSelect, selectedRole }) {
  return (
    <>
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        Кто оформляет отправку?
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        Выберите один из вариантов ниже 👉
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-8">
        <button
          onClick={() => onRoleSelect("sender")}
          className={`p-4 md:p-6 rounded-xl border transition-all ${
            selectedRole === "sender"
              ? "border-[#0077FE] bg-[#F0F7FF]"
              : "border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]"
          }`}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl">
              📦
            </div>
            <div className="text-center">
              <h3 className="text-base md:text-lg font-bold text-[#2D2D2D] mb-1 md:mb-2">
                Я отправитель
              </h3>
              <p className="text-xs md:text-sm text-[#2D2D2D] leading-relaxed">
                Посылка у меня. Я передам её курьеру
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => {
            if (
              typeof window !== "undefined" &&
              typeof window.ym === "function"
            ) {
              window.ym(104664178, "params", { flow_step: "recipient" });
            }
            onRoleSelect("recipient");
          }}
          className={`p-4 md:p-6 rounded-xl border transition-all ${
            selectedRole === "recipient"
              ? "border-[#0077FE] bg-[#F0F7FF]"
              : "border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#0077FE]"
          }`}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center text-4xl md:text-6xl relative">
              <span>📲</span>
            </div>
            <div className="text-center">
              <h3 className="text-base md:text-lg font-bold text-[#2D2D2D] mb-1 md:mb-2">
                Я получатель
              </h3>
              <p className="text-xs md:text-sm text-[#2D2D2D] leading-relaxed">
                Посылка у отправителя. Я оформляю
              </p>
            </div>
          </div>
        </button>
      </div>
    </>
  );
}

export default RoleSelectStep;
