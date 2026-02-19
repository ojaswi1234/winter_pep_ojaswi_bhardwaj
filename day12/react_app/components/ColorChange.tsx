import React from 'react'

interface ColorChangeProps {
  theme: number;
  setTheme: (theme: number) => void;
   emoji: string;
  setEmoji: (emoji: string) => void;
}



export const ColorChange = ({ theme, setTheme, emoji, setEmoji }: ColorChangeProps) => {
  return (
    <button className="color-button" onClick={() => {
      if (theme === 0) {
        setTheme(0);
        setEmoji('🌙')
        } else {
            setTheme(Math.random() * 255)
            setEmoji('☀️')
            }
            }}>
      {emoji}
    </button>

  )
};