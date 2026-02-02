import Link from "next/link"
import Image from "next/image";
import deepboundLogo from "@/../public/deepbound_logo.svg";

function Logo({ size = 25 }: { size?: number }) {
  return (
    <Link href="/" className="flex items-center gap-3 group">
      <Image
        src={deepboundLogo}
        alt="DeepBound Logo"
        width={size}
      />
    </Link>
  )
}

export default Logo
