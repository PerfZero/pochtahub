import { useState, useRef, useEffect } from 'react'

function CodeInput({ value = '', onChange, onComplete }) {
  const [codes, setCodes] = useState(['', '', '', ''])
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    if (value) {
      const codesArray = value.split('').slice(0, 4)
      const newCodes = [...codes]
      codesArray.forEach((char, idx) => {
        if (idx < 4) newCodes[idx] = char
      })
      setCodes(newCodes)
    }
  }, [value])

  const handleChange = (index, newValue) => {
    if (newValue.length > 1) {
      newValue = newValue.slice(-1)
    }
    if (!/^\d*$/.test(newValue)) return

    const newCodes = [...codes]
    newCodes[index] = newValue
    setCodes(newCodes)

    const codeString = newCodes.join('')
    onChange({ target: { value: codeString } })

    if (newValue && index < 3) {
      setTimeout(() => {
        inputRefs[index + 1].current?.focus()
      }, 0)
    }

    if (codeString.length === 4) {
      setTimeout(() => {
        onComplete?.(codeString)
      }, 100)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !codes[index] && index > 0) {
      inputRefs[index - 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 4).replace(/\D/g, '')
    if (pastedData) {
      const newCodes = pastedData.split('').slice(0, 4)
      while (newCodes.length < 4) newCodes.push('')
      setCodes(newCodes)
      const codeString = newCodes.join('')
      onChange({ target: { value: codeString } })
      if (codeString.length === 4) {
        onComplete?.(codeString)
        inputRefs[3].current?.blur()
      } else {
        inputRefs[newCodes.length].current?.focus()
      }
    }
  }

  return (
    <div className="flex gap-3 justify-center">
      {codes.map((code, index) => (
        <input
          key={index}
          ref={inputRefs[index]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={code}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className="w-14 h-14 text-center text-2xl font-bold border-2 border-[#C8C7CC] rounded-xl focus:border-[#0077FE] focus:outline-none"
        />
      ))}
    </div>
  )
}

export default CodeInput







