import Image from "next/image";

export function Logo() {
  return (
    <div className="relative flex items-center">
      <Image
        src="/images/logo/logo.png"
        alt="Sa3dne logo"
        width={240}
        height={240}
        quality={100}
        className="object-contain"
      />
    </div>
  );
}
