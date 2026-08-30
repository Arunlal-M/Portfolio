import { lazy, Suspense } from "react";
import "./App.css";

const CharacterModel = lazy(() => import("./components/Character"));
const MainContainer = lazy(() => import("./components/MainContainer"));
import { LoadingProvider } from "./context/LoadingProvider";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

const App = () => {
  return (
    <>
      <LoadingProvider>
        <Suspense fallback={null}>
          <MainContainer>
            <Suspense fallback={null}>
              <CharacterModel />
            </Suspense>
          </MainContainer>
        </Suspense>
      </LoadingProvider>
      <SpeedInsights />
      <Analytics />
    </>
  );
};

export default App;
