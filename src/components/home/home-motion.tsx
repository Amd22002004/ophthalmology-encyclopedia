"use client";

import { useEffect, useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import {
  LazyMotion,
  MotionConfig,
  domAnimation,
  m,
  useAnimationControls,
  useReducedMotion,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

// Плавное замедление без перелёта: анимации главной не должны «отскакивать».
const easeOut = [0.22, 1, 0.36, 1] as const;

/**
 * Единственный провайдер анимаций главной: `m` + `LazyMotion(domAnimation)`.
 * `strict` запрещает тяжёлый `motion.*`, `reducedMotion="user"` отключает
 * трансформации при системной настройке «уменьшить движение».
 */
export function HomeMotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}

/**
 * Серверный HTML всегда содержит видимый текст (`initial={false}`): скрытое
 * состояние выставляется только на клиенте и только для блока, который при
 * монтировании ещё ниже первого экрана. Блок в первом экране или выше него
 * не мигает, а при reduced motion ничего не скрывается.
 */
function useBelowFoldControls<T extends Element>() {
  const ref = useRef<T>(null);
  const controls = useAnimationControls();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = ref.current;
    if (!element || reduceMotion) return;
    if (element.getBoundingClientRect().top > window.innerHeight) controls.set("hidden");
  }, [controls, reduceMotion]);

  return { ref, controls };
}

const revealVariants: Variants = {
  hidden: { opacity: 0, y: 12, transition: { duration: 0 } },
  visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
};

type RevealProps = Pick<ComponentPropsWithoutRef<"section">, "aria-labelledby" | "children" | "className" | "id">;

/** Блок появляется один раз при прокрутке (`whileInView`). */
export function RevealSection({ children, ...props }: RevealProps) {
  const { ref, controls } = useBelowFoldControls<HTMLElement>();
  return (
    <m.section
      {...props}
      animate={controls}
      initial={false}
      ref={ref}
      variants={revealVariants}
      viewport={{ once: true, amount: 0.15 }}
      whileInView="visible"
    >
      {children}
    </m.section>
  );
}

const staggerListVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const staggerIconVariants: Variants = {
  hidden: { opacity: 0, transition: { duration: 0 } },
  visible: { opacity: 1, transition: { duration: 0.24, ease: "easeOut" } },
};

/** Список, иконки которого появляются по очереди с шагом 60 мс. */
export function StaggerIconList({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, controls } = useBelowFoldControls<HTMLUListElement>();
  return (
    <m.ul
      animate={controls}
      className={className}
      initial={false}
      ref={ref}
      variants={staggerListVariants}
      viewport={{ once: true, amount: 0.3 }}
      whileInView="visible"
    >
      {children}
    </m.ul>
  );
}

/** Иконка внутри `StaggerIconList`: анимируется только прозрачность. */
export function StaggerIcon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <m.span aria-hidden="true" className={className} variants={staggerIconVariants}>
      {children}
    </m.span>
  );
}

const stepsListVariants: Variants = { hidden: {}, visible: {} };

const connectorCount = 3;
const connectorDuration = 0.4 / connectorCount;

/** Список шагов, соединительная линия которого прорисовывается один раз. */
export function DrawnStepsList({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, controls } = useBelowFoldControls<HTMLOListElement>();
  return (
    <m.ol
      animate={controls}
      className={className}
      initial={false}
      ref={ref}
      variants={stepsListVariants}
      viewport={{ once: true, amount: 0.4 }}
      whileInView="visible"
    >
      {children}
    </m.ol>
  );
}

/**
 * Отрезок линии от шага `index` к следующему. Отрезки рисуются друг за другом,
 * поэтому вся линия занимает 400 мс. На мобильной ширине линия вертикальная.
 */
export function StepConnector({ index }: { index: number }) {
  const variants: Variants = {
    hidden: { pathLength: 0, transition: { duration: 0 } },
    visible: {
      pathLength: 1,
      transition: { duration: connectorDuration, delay: index * connectorDuration, ease: "linear" },
    },
  };
  const lineClass = "stroke-primary [stroke-width:2]";

  return (
    <>
      <svg aria-hidden="true" className="absolute left-5 top-5 h-[calc(100%+1.25rem)] w-0.5 -translate-x-1/2 overflow-visible md:hidden">
        <m.line className={lineClass} variants={variants} x1="1" x2="1" y1="0" y2="100%" />
      </svg>
      <svg aria-hidden="true" className="absolute left-5 top-5 hidden h-0.5 w-[calc(100%+1.25rem)] -translate-y-1/2 overflow-visible md:block">
        <m.line className={lineClass} variants={variants} x1="0" x2="100%" y1="1" y2="1" />
      </svg>
    </>
  );
}

/** Кнопка с мягкой реакцией на наведение и нажатие; при reduced motion — статична. */
export function PressScale({ children, className }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <m.div
      className={cn("inline-flex", className)}
      transition={{ duration: 0.2, ease: easeOut }}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.98 }}
    >
      {children}
    </m.div>
  );
}
