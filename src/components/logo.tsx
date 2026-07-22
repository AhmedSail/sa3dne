import Image from "next/image";

export function Logo() {
  return (
    <div className="mx-auto flex items-center justify-center">
      <Image
        src="/images/logo/logo.png"
        alt="Sa3dne logo"
        width={200}
        height={100}
        quality={100}
        className="h-auto w-full object-contain"
        priority
      />
    </div>
  );
}
