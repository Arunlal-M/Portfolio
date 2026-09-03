import { lazy, PropsWithChildren, Suspense, useEffect, useState } from "react";
import About from "./About";
import Cursor from "./Cursor";
import Landing from "./Landing";
import Navbar from "./Navbar";
import SocialIcons from "./SocialIcons";
import WhatIDo from "./WhatIDo";
import setSplitText from "../utils/splitText";

const Career = lazy(() => import("./Career"));
const Contact = lazy(() => import("./Contact"));
const Work = lazy(() => import("./Work"));
const TechStack = lazy(() => import("./TechStack"));
const ChatWidget = lazy(() => import("./ChatWidget"));

const MainContainer = ({ children }: PropsWithChildren) => {
  const [isDesktopView, setIsDesktopView] = useState<boolean>(
    window.innerWidth > 1024
  );

  useEffect(() => {
    const resizeHandler = () => {
      setSplitText();
      setIsDesktopView(window.innerWidth > 1024);
    };
    resizeHandler();
    window.addEventListener("resize", resizeHandler);
    return () => {
      window.removeEventListener("resize", resizeHandler);
    };
  }, [isDesktopView]);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialIcons />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
      {isDesktopView && children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <div className="container-main">
            <Landing>{!isDesktopView && children}</Landing>
            <About />
            <WhatIDo />
            <Suspense fallback={null}>
              <Career />
              <Work />
              {isDesktopView && (
                <TechStack />
              )}
              <Contact />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
