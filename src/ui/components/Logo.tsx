import Image from "next/image";
import deepboundLogo from "@/../public/deepbound_logo.svg";

function Logo({ size = 25 }: { size?: number }) {
  return (
    <Image
      src={deepboundLogo}
      alt="DeepBound Logo"
      width={size}
    />
  )
}

export default Logo
