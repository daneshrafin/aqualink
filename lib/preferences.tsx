'use client';
import {createContext,useContext,useEffect,useState} from 'react';
type Mode='community'|'responder';type Lang='en'|'bn';type Theme='light'|'dark';
const Context=createContext<{mode:Mode;setMode:(m:Mode)=>void;lang:Lang;setLang:(l:Lang)=>void;theme:Theme;setTheme:(t:Theme)=>void;ready:boolean}|null>(null);
export function PreferencesProvider({children}:{children:React.ReactNode}){const [mode,setMode]=useState<Mode>('community'),[lang,setLang]=useState<Lang>('en'),[theme,setTheme]=useState<Theme>('light'),[ready,setReady]=useState(false);useEffect(()=>{try{setMode(localStorage.getItem('aq_mode')==='responder'?'responder':'community');setLang(localStorage.getItem('aq_lang')==='bn'?'bn':'en');setTheme(localStorage.getItem('aq_theme')==='dark'?'dark':'light')}catch{}setReady(true)},[]);useEffect(()=>{if(!ready)return;localStorage.setItem('aq_mode',mode);localStorage.setItem('aq_lang',lang);localStorage.setItem('aq_theme',theme);document.documentElement.dataset.theme=theme;document.documentElement.lang=lang},[mode,lang,theme,ready]);return <Context.Provider value={{mode,setMode,lang,setLang,theme,setTheme,ready}}>{children}</Context.Provider>}
export function usePreferences(){const p=useContext(Context);if(!p)throw Error('PreferencesProvider missing');return p}
export const t=(lang:Lang,en:string,bn:string)=>lang==='bn'?bn:en;
