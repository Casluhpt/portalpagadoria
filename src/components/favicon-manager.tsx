import { useEffect } from "react";
import { useLogos } from "@/hooks/use-logos";

/**
 * Aplica o PNG configurado para a área "favicon" no <link rel="icon"> do documento.
 */
export function FaviconManager() {
  const { logos, loading } = useLogos();

  useEffect(() => {
    if (loading) return;
    const href = logos.favicon || logos.global;
    if (!href) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/png";
    link.href = href;
  }, [logos, loading]);

  return null;
}
