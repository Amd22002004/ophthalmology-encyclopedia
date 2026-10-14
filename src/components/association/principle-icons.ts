import {
  BadgeCheck,
  BookOpenText,
  HandHeart,
  HeartHandshake,
  Scale,
  type LucideIcon,
} from "lucide-react";

/**
 * Иконки пяти принципов Ассоциации в порядке `associationPrinciples`.
 * Общие для главной и «Об Ассоциации», чтобы принцип везде выглядел одинаково.
 */
export const associationPrincipleIcons: readonly LucideIcon[] = [
  HeartHandshake,
  BadgeCheck,
  Scale,
  BookOpenText,
  HandHeart,
];
