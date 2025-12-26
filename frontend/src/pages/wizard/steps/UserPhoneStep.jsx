import PhoneInput from '../../../components/PhoneInput'
import CodeInput from '../../../components/CodeInput'

function UserPhoneStep({
  selectedRole,
  userPhone,
  onUserPhoneChange,
  userFIO,
  onUserFIOChange,
  userFioFocused,
  onUserFioFocus,
  onUserFioBlur,
  codeSent,
  auth,
  onSendCode,
  onVerifyCode,
  onResendCode,
  onContinue
}) {
  if (!codeSent) {
    return (
      <div className="mb-8">
        <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
          {selectedRole === 'recipient' ? 'Укажите ваши данные' : 'Ваш телефон'}
        </h1>
        <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
          {selectedRole === 'recipient' ? 'Нужны для связи и оформления доставки.' : 'Это необходимо для оформления заказа, так же вы сможете отслеживать статус используя номер'}
        </p>
        {selectedRole === 'recipient' ? (
          <>
            <div className="mb-6">
              <div className="relative">
                <div className={`relative border rounded-xl ${
                  userFioFocused ? 'border-[#0077FE]' : 'border-[#C8C7CC]'
                }`}>
                  <input
                    type="text"
                    value={userFIO}
                    onChange={onUserFIOChange}
                    onFocus={onUserFioFocus}
                    onBlur={onUserFioBlur}
                    placeholder=" "
                    className="w-full px-4 pt-6 pb-2 border-0 bg-transparent rounded-xl text-base text-[#2D2D2D] focus:outline-none"
                  />
                  <label className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                    userFIO || userFioFocused ? 'top-2 text-xs' : 'top-1/2 -translate-y-1/2 text-base'
                  } ${userFioFocused ? 'text-[#0077FE]' : 'text-[#858585]'}`}>
                    ФИО
                  </label>
                </div>
              </div>
            </div>
            <button
              onClick={onContinue}
              disabled={!userFIO}
              className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50"
            >
              Продолжить
            </button>
          </>
        ) : (
          <>
            <div className="mb-6">
              <PhoneInput
                value={userPhone}
                onChange={onUserPhoneChange}
                label="Ваш телефон"
              />
            </div>
            {auth.codeError && (
              <div className="mb-4">
                <p className="text-sm text-red-500 text-center mb-2">{auth.codeError}</p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onSendCode('telegram')}
                disabled={auth.codeLoading || !userPhone}
                className="w-full bg-[#0077FE] text-white px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50"
              >
                {auth.codeLoading ? 'Отправка...' : 'Получить код в Telegram'}
              </button>
              <button
                onClick={() => onSendCode('sms')}
                disabled={auth.codeLoading || !userPhone}
                className="w-full bg-white border border-[#0077FE] text-[#0077FE] px-6 py-3 md:py-4 rounded-xl text-sm md:text-base font-semibold disabled:opacity-50"
              >
                {auth.codeLoading ? 'Отправка...' : 'Отправить SMS'}
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="mb-8">
      <h1 className="text-xl md:text-3xl font-bold text-[#2D2D2D] mb-2 text-center px-2">
        {auth.telegramSent ? 'Введите код из Telegram' : 'Введите код из СМС'}
      </h1>
      <p className="text-sm md:text-base text-[#2D2D2D] mb-6 md:mb-8 text-center px-2">
        {auth.telegramSent ? (
          <>Отправили в <strong>Telegram</strong></>
        ) : (
          <>Отправили на <strong>{userPhone}</strong></>
        )}
      </p>
      <div className="mb-6">
        <CodeInput
          value={auth.smsCode}
          onChange={(e) => auth.setSmsCode(e.target.value)}
          onComplete={(code) => {
            auth.setSmsCode(code)
            if (code && code.length === 4) {
              onVerifyCode(code)
            }
          }}
        />
      </div>
      {auth.codeError && (
        <div className="mb-4">
          <p className="text-sm text-red-500 text-center mb-2">{auth.codeError}</p>
        </div>
      )}
      {auth.telegramSent && (
        <p className="text-sm text-green-600 mb-4 text-center">
          Код отправлен в Telegram
        </p>
      )}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            auth.resetCodeState()
          }}
          className="text-sm text-[#0077FE] hover:underline"
        >
          Изменить номер
        </button>
        <button
          type="button"
          onClick={onResendCode}
          disabled={auth.codeLoading}
          className="text-sm text-[#858585] hover:text-[#2D2D2D] disabled:opacity-50"
        >
          Получить новый код
        </button>
      </div>
    </div>
  )
}

export default UserPhoneStep

