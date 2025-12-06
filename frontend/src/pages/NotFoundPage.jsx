import { Link } from 'react-router-dom'
import logoSvg from '../assets/images/logo.svg'
import iconVerify from '../assets/images/icon-verify.svg'

function NotFoundPage() {
  const isAuthenticated = !!localStorage.getItem('access_token')
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="w-full flex justify-center items-center p-6">
        <div className="w-full max-w-[1128px] flex items-center gap-6">
          <Link to="/">
            <img src={logoSvg} alt="PochtaHub" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <img src={iconVerify} alt="" className="w-6 h-6" />
            <span className="text-xs text-[#2D2D2D]">Агрегатор транспортных компаний</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link to={isAuthenticated ? "/cabinet" : "/login"} className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#F4EEE2] text-[#2D2D2D]">{isAuthenticated ? "Личный кабинет" : "Войти"}</Link>
            <Link to="/calculate" className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#0077FE] text-white">Рассчитать</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 text-center">
          <div className="relative">
            <div className="text-[200px] font-bold text-[#F4EEE2] leading-none select-none">404</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 bg-[rgba(0,119,254,0.16)] rounded-2xl rotate-12 flex items-center justify-center">
                <span className="text-5xl">📦</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h1 className="text-3xl font-bold text-[#2D2D2D]">Страница не найдена</h1>
            <p className="text-lg text-[#858585] max-w-[400px]">Похоже, эта посылка потерялась. Но мы поможем найти нужное направление!</p>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="px-6 py-4 rounded-xl text-base font-semibold bg-[#0077FE] text-white">На главную</Link>
            <Link to="/calculate" className="px-6 py-4 rounded-xl text-base font-semibold bg-[#F4EEE2] text-[#2D2D2D]">Рассчитать доставку</Link>
          </div>
        </div>
      </main>

      <footer className="w-full flex justify-center px-6 py-8">
        <div className="w-full max-w-[1128px] flex items-center justify-center gap-6 border-t border-[#C8C7CC] pt-8">
          <img src={logoSvg} alt="PochtaHub" className="h-6 opacity-50" />
          <span className="text-sm text-[#858585]">© 2025 PochtaHub</span>
        </div>
      </footer>
    </div>
  )
}

export default NotFoundPage


