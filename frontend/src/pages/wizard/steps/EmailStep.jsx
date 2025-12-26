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
  onContinue
}) {
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
          <div className={`relative border rounded-xl ${
            emailFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
          }`}>
            <input
              type="email"
              value={email}
              onChange={onEmailChange}
              onFocus={onEmailFocus}
              onBlur={onEmailBlur}
              placeholder=" "
              className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
            />
            <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
              email || emailFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
            } ${emailFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
              Электронный адрес
            </label>
          </div>
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
            Я согласен с <a href="#" className="text-[#0077FE] hover:underline">Условиями обработки моих персональных данных</a>, а также даю <a href="#" className="text-[#0077FE] hover:underline">Согласие на обработку моих ПД</a>
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
            Даю <a href="#" className="text-[#0077FE] hover:underline">Согласие для направления информационных сообщений</a>. Отписаться от рассылки можно в любое время.
          </span>
        </label>
      </div>
      <button 
        onClick={onContinue}
        disabled={!email || !agreePersonalData || loadingOffers}
        className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingOffers ? 'Загрузка...' : 'Продолжить'}
      </button>
    </div>
  )
}

export default EmailStep

