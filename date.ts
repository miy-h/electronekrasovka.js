import { Temporal } from "@js-temporal/polyfill";

export function getMonthNumberFromStandAloneMonthName(
  monthName: string,
): number {
  return [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ].indexOf(monthName) + 1;
}

export function extractDate(str: string): Temporal.PlainDate | null {
  const monthNames = [
    "января",
    "февраля",
    "марта",
    "апреля",
    "мая",
    "июня",
    "июля",
    "августа",
    "сентября",
    "октября",
    "ноября",
    "декабря",
  ];
  const result = str.match(
    new RegExp(
      `(?<day>\\d+)\\s*(?<month>${
        monthNames.join("|")
      })\\s*,?\\s*(?<year>\\d+)`,
    ),
  );
  if (!result) {
    return null;
  }
  return Temporal.PlainDate.from({
    year: parseInt(result.groups!.year!),
    month: monthNames.indexOf(result.groups!.month) + 1,
    day: parseInt(result.groups!.day!),
  });
}
