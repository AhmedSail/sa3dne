import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/images/logo/logo-trimmed.png"
      alt="Sa3dne logo"
      width={340}
      height={135}
      quality={100}
      // Sized by height, not width: the rendered box then stays the same no
      // matter what aspect ratio the asset happens to have.
      className="h-12 w-auto object-contain"
      priority
    />
  );
}
