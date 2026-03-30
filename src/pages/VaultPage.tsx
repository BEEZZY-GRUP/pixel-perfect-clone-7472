import { useLayoutEffect } from "react";

const VaultPage = () => {
  useLayoutEffect(() => {
    const root = document.getElementById("root");

    const previous = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlMargin: document.documentElement.style.margin,
      htmlHeight: document.documentElement.style.height,
      bodyOverflow: document.body.style.overflow,
      bodyMargin: document.body.style.margin,
      bodyHeight: document.body.style.height,
      rootOverflow: root?.style.overflow ?? "",
      rootMargin: root?.style.margin ?? "",
      rootPadding: root?.style.padding ?? "",
      rootHeight: root?.style.height ?? "",
      rootMaxWidth: root?.style.maxWidth ?? "",
    };

    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.height = "100%";
    document.body.style.overflow = "hidden";
    document.body.style.margin = "0";
    document.body.style.height = "100%";

    if (root) {
      root.style.overflow = "hidden";
      root.style.margin = "0";
      root.style.padding = "0";
      root.style.height = "100%";
      root.style.maxWidth = "none";
    }

    return () => {
      document.documentElement.style.overflow = previous.htmlOverflow;
      document.documentElement.style.margin = previous.htmlMargin;
      document.documentElement.style.height = previous.htmlHeight;
      document.body.style.overflow = previous.bodyOverflow;
      document.body.style.margin = previous.bodyMargin;
      document.body.style.height = previous.bodyHeight;

      if (root) {
        root.style.overflow = previous.rootOverflow;
        root.style.margin = previous.rootMargin;
        root.style.padding = previous.rootPadding;
        root.style.height = previous.rootHeight;
        root.style.maxWidth = previous.rootMaxWidth;
      }
    };
  }, []);

  return (
    <iframe
      src="/vault.html"
      title="Beezzy Vault"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
        margin: 0,
        padding: 0,
        display: "block",
      }}
    />
  );
};

export default VaultPage;
