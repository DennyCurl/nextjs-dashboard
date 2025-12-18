import { roboto } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${roboto.className} flex flex-row items-center leading-none text-white`}
    >
  {/* Globe icon intentionally removed; keep markup simple */}
      <p className="text-[24px]">Філія ЦОЗ ДКВС України у Харківській та Луганській областях</p>
    </div>
  );
}
