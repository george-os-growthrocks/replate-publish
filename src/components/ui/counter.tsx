import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface CounterProps {
  value: number;
  duration?: number;
  className?: string;
}

export function Counter({ value, duration = 2, className = "" }: CounterProps) {
  const spring = useSpring(0, { duration: duration * 1000 });
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span className={className}>{display}</motion.span>;
}
