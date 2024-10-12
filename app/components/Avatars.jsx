// app/components/Avatars.jsx
import Image from "next/image";
import React from "react";

const Avatars = () => {
  return (
    <div>
      <Image src="/images/avatar.png" alt="Avatar" width={100} height={100} />
    </div>
  );
};

export default Avatars;
