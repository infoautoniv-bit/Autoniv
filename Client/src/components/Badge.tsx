// components/Badge.tsx
import { motion } from 'framer-motion';

interface BadgeProps {
  count: number;
  size?: 'sm' | 'md' | 'lg';
}

export function Badge({ count, size = 'sm' }: BadgeProps) {
  const sizes = {
    sm: 'min-w-[18px] h-[18px] text-[10px]',
    md: 'min-w-[22px] h-[22px] text-xs',
    lg: 'min-w-[26px] h-[26px] text-sm',
  };

  if (count > 99) {
    count = 99;
  }

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      className={`${sizes[size]} rounded-full bg-gradient-to-r from-[#ef4444] to-[#f59e0b] flex items-center justify-center text-white font-bold shadow-lg`}
    >
      {count}
    </motion.div>
  );
}