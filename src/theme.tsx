import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';
const ThemeContext = createContext<{theme: Theme; setTheme: (theme: Theme) => void; toggleTheme: () => void}>({theme:'dark',setTheme:()=>{},toggleTheme:()=>{}});
export function ThemeProvider({children}:{children:ReactNode}) {
  const [theme,setThemeState]=useState<Theme>(()=>{try{return localStorage.getItem('mole-theme')==='light'?'light':'dark';}catch{return 'dark';}});
  const setTheme=(next:Theme)=>{setThemeState(next);try{localStorage.setItem('mole-theme',next);}catch{}};
  const toggleTheme=()=>setTheme(theme==='dark'?'light':'dark');
  document.documentElement.dataset.theme = theme;
  const value=useMemo(()=>({theme,setTheme,toggleTheme}),[theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
export function useTheme(){return useContext(ThemeContext);}
