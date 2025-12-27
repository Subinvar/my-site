import { Montserrat, Open_Sans } from "next/font/google";

export const headingFont = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],   // можно ужать до ["600","700"], если 500 реально нигде не нужен
  display: "swap",
  variable: "--font-heading-var",
});

export const bodyFont = Open_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],   // можно ужать до ["400","600"]
  display: "swap",
  variable: "--font-body-var",
});
