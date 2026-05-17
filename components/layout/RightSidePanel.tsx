import { DetailSidePanel } from "./DetailSidePanel";

export function RightSidePanel({
  children,
  closeHref,
  title,
}: {
  children: React.ReactNode;
  closeHref: string;
  title: string;
}) {
  return (
    <DetailSidePanel closeHref={closeHref} title={title}>
      {children}
    </DetailSidePanel>
  );
}
