import { useRef } from 'react'
import { IMaskInput } from 'react-imask'

function PhoneInput({ value, onChange, className = '', ...props }) {
  const maskRef = useRef(null)

  return (
    <IMaskInput
      mask="+7 (000) 000-00-00"
      value={value}
      onAccept={(val) => onChange({ target: { value: val } })}
      inputRef={maskRef}
      placeholder="+7 (___) ___-__-__"
      className={className || 'form-control'}
      style={{
        width: '100%',
        padding: '8px 12px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        fontSize: '14px',
      }}
      {...props}
    />
  )
}

export default PhoneInput

