import * as React from "react"
import { DayPicker, getDefaultClassNames, type DayButton } from "react-day-picker"
import { th } from "react-day-picker/locale"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"

/** shadcn Calendar (react-day-picker v9) — ภาษาไทย ปี พ.ศ. */
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const d = getDefaultClassNames()
  return (
    <DayPicker
      locale={th}
      showOutsideDays={showOutsideDays}
      className={cn("group/calendar p-1 [--cell-size:--spacing(8.5)]", className)}
      formatters={{
        formatCaption: (date) =>
          `${date.toLocaleDateString("th-TH", { month: "long" })} ${date.getFullYear() + 543}`,
        formatWeekdayName: (date) => ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"][date.getDay()],
      }}
      classNames={{
        root: cn("w-fit", d.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", d.months),
        month: cn("flex w-full flex-col gap-3", d.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between", d.nav),
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "aria-disabled:opacity-40", d.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "aria-disabled:opacity-40", d.button_next),
        month_caption: cn("flex h-7 w-full items-center justify-center px-8 text-sm font-bold", d.month_caption),
        weekdays: cn("flex", d.weekdays),
        weekday: cn("w-(--cell-size) text-[0.75rem] font-normal text-muted-foreground select-none", d.weekday),
        week: cn("mt-1 flex w-full", d.week),
        day: cn(
          "group/day relative aspect-square h-(--cell-size) w-(--cell-size) p-0 text-center select-none",
          "data-[selected=true]:bg-muted [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          d.day
        ),
        range_start: cn("rounded-l-md bg-muted", d.range_start),
        range_middle: cn("rounded-none", d.range_middle),
        range_end: cn("rounded-r-md bg-muted", d.range_end),
        today: cn("[&_button]:font-black [&_button]:underline [&_button]:underline-offset-4", d.today),
        outside: cn("text-muted-foreground/50", d.outside),
        disabled: cn("text-muted-foreground opacity-40", d.disabled),
        hidden: cn("invisible", d.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: c }) =>
          orientation === "left" ? <ChevronLeftIcon className={cn("size-4", c)} /> : <ChevronRightIcon className={cn("size-4", c)} />,
        DayButton: CalendarDayButton,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({ className, day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) {
  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])
  return (
    <button
      ref={ref}
      data-day={day.date.toLocaleDateString()}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "num flex aspect-square size-auto w-full min-w-(--cell-size) items-center justify-center rounded-md text-sm hover:bg-muted",
        "data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground",
        "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Calendar }
