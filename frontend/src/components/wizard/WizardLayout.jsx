import { Link } from "react-router-dom";
import logoSvg from "../../assets/whitelogo.svg";

function WizardLayout({ progress, progressText, stepLabel, onBack, children }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="w-full bg-[#0077FE] flex flex-col items-center px-4 md:px-6 py-4 md:py-6 gap-4 md:gap-6">
        <Link to="/calculate">
          <img src={logoSvg} alt="PochtaHub" className="h-6 md:h-8" />
        </Link>
      </header>

      <div className="flex justify-center pt-6 md:pt-12 pb-8">
        <div className="w-full max-w-[720px] bg-white rounded-2xl p-4 md:p-8 mx-4 md:mx-6">
          <div className="mb-6">
            <div className="w-full h-1 bg-[#E5F0FF] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0077FE]"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs md:text-sm font-semibold text-[#0077FE]">
                {stepLabel || ""}
              </span>
              <span className="text-xs md:text-sm text-[#858585]">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="text-sm text-[#858585] mt-1 text-center">
              {progressText}
            </p>
          </div>

          {children}

          <div className="text-center">
            <button
              onClick={onBack || (() => window.history.back())}
              className="text-sm text-[#858585] hover:text-[#2D2D2D] transition-colors"
            >
              ← Вернуться назад
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WizardLayout;
