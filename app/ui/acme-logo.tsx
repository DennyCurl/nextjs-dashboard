import { roboto } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${roboto.className} flex flex-row items-center leading-none text-white`}
    >
  {/* Globe icon intentionally removed; keep markup simple */}
      <p className="text-[24px]">Медична частина №43</p>
    </div>
  );
}
