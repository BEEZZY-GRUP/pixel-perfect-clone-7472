import { useEffect } from "react";

const HomePage = () => {
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.margin = "";
    };
  }, []);

  return (
    <iframe
      src="/landing.html"
      title="Beezzy"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
        margin: 0,
        padding: 0,
        display: "block",
      }}
    />
  );
};

export default HomePage;
