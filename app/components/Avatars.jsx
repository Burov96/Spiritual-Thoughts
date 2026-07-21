
import Image from "next/image";
import { useTheme } from '@/app/context/ThemeContext';

const Avatars = () => {
  const { colors } = useTheme();
  return (
    <div>
      <Image src="/images/user.png"  alt="Avatar" width={100} height={100} />
    </div>
  );
};

export default Avatars;
