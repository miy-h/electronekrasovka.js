import * as v from "valibot";
import { Temporal } from "@js-temporal/polyfill";
import { extractDate, getMonthNumberFromStandAloneMonthName } from "./date.ts";

const PeriodicalInfoResponseSchema = v.object({
  response: v.object({
    type: v.string(),
    name: v.string(),
    description: v.nullable(v.string()),
    url: v.string(),
    years: v.record(
      v.string(),
      v.object({
        value: v.number(),
        url: v.string(),
        count: v.number(),
        months: v.array(v.object({
          value: v.string(),
          url: v.nullable(v.string()),
          count: v.number(),
          values: v.record(v.string(), v.string()),
        })),
      }),
    ),
  }),
});

interface PeriodicalInfo {
  type: string;
  name: string;
  description: string | null;
  url: string;
  years: {
    year: number;
    url: string;
    count: number;
    months: {
      month: Temporal.PlainYearMonth;
      url: string | null;
      count: number;
    }[];
  }[];
}

export async function fetchPeriodicalInfo(
  periodicalId: string,
): Promise<PeriodicalInfo> {
  const endpoint =
    `https://api.electro.nekrasovka.ru/api/editions/${periodicalId}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP status ${response.status}`);
  }
  const { response: responseData } = v.parse(
    PeriodicalInfoResponseSchema,
    await response.json(),
  );
  const result: PeriodicalInfo = {
    type: responseData.type,
    name: responseData.name,
    description: responseData.description,
    url: responseData.url,
    years: [],
  };

  for (const originalYearData of Object.values(responseData.years)) {
    const yearData: PeriodicalInfo["years"][number] = {
      year: originalYearData.value,
      url: originalYearData.url,
      count: originalYearData.count,
      months: [],
    };
    for (const originalMonthData of originalYearData.months) {
      yearData.months.push({
        month: Temporal.PlainYearMonth.from({
          year: originalYearData.value,
          month: getMonthNumberFromStandAloneMonthName(originalMonthData.value),
        }),
        url: originalMonthData.url,
        count: originalMonthData.count,
      });
    }
    result.years.push(yearData);
  }

  return result;
}

const IssuesByMonthResponseSchema = v.object({
  response: v.object({
    type: v.string(),
    name: v.string(),
    year: v.string(),
    month: v.number(),
    url: v.string(),
    items: v.array(v.object({
      title: v.string(),
      image: v.string(),
      url: v.string(),
    })),
    items_count: v.number(),
    items_left: v.number(),
  }),
});

export interface IssuesByMonthInfo {
  type: string;
  name: string;
  url: string;
  issues: {
    title: string;
    image: string;
    url: string;
    date: Temporal.PlainDate | null;
    issueNumber: { year: number; total: number } | null;
    bookId: string;
  }[];
  nextOffset: number | null;
}

function extractIssueNumber(str: string) {
  const result = str.match(/№\s*(?<year>\d+)\s*\((?<total>\d+)\)/);
  if (!result) {
    return null;
  }
  return {
    year: parseInt(result.groups!.year!),
    total: parseInt(result.groups!.total!),
  };
}

function extractBookId(url: string) {
  const result = url.match(/^\/books\/(\d+)/);
  if (!result) {
    throw new Error(`Unknown book URL: ${url}`);
  }
  return result[1];
}

export async function fetchIssuesInfoByMonth(
  periodicalId: string,
  yearMonth: Temporal.PlainYearMonth,
  limit: number,
  offset: number,
): Promise<IssuesByMonthInfo> {
  const endpoint =
    `https://api.electro.nekrasovka.ru/api/editions/${periodicalId}/${yearMonth.year}/${yearMonth.month}?limit=${limit}&offset=${offset}`;
  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(`HTTP status ${response.status}`);
  }
  const { response: responseData } = v.parse(
    IssuesByMonthResponseSchema,
    await response.json(),
  );
  const result: IssuesByMonthInfo = {
    type: responseData.type,
    name: responseData.name,
    url: responseData.url,
    issues: [],
    nextOffset: responseData.items_left === 0 ? null : offset + limit,
  };
  for (const issue of responseData.items) {
    result.issues.push({
      title: issue.title,
      image: issue.image,
      url: issue.url,
      date: extractDate(issue.title),
      issueNumber: extractIssueNumber(issue.title),
      bookId: extractBookId(issue.url),
    });
  }
  return result;
}
