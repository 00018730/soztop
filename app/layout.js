import "./globals.css";

export const metadata = {
  title: "Soʻztop — oʻzbekcha soʻz oʻyini",
  description:
    "Har kuni yangi 5 harfli oʻzbekcha soʻzni 6 ta urinishda toping.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
