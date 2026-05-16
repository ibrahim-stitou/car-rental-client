import { SessionProvider } from "next-auth/react";
import { LanguageProvider } from "@/context/LanguageContext";
//@ts-ignore
function App({ Component, pageProps }) {
  return (
    <SessionProvider
      refetchInterval={60 * 60} // 1 hour
      refetchOnWindowFocus={false}
    >
      <LanguageProvider>
        <Component {...pageProps} />
      </LanguageProvider>
    </SessionProvider>
  );
}

export default App;