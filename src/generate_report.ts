import * as fs from "fs";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";

import "dotenv/config";

type Data = {
  Date: string;
  From: string;
  To: string;
  Cost: string;
};

type Entry = {
  date: number;
  [key: string]: number | string;
};

const TYPE_FILTER = [
  "Flexible",
  "Standard (Monthly)",
  "Standard (Annual)",
  "Sustaining (Annual)",
  "regular",
];

const host = "capitolhill.myturn.com";

const today = new Date();
const sixtyDaysAgo = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1);
  const day = String(date.getDate());
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const FROM_DATE = formatDate(sixtyDaysAgo);
const TO_DATE = formatDate(today);

const getLoginCookie = async () => {
  const myturnUsername = process.env["MYTURN_USERNAME"];
  const myturnPassword = process.env["MYTURN_PASSWORD"];

  if (!myturnUsername || !myturnPassword) {
    throw new Error(
      "MYTURN_USERNAME and MYTURN_PASSWORD environment variables must be set."
    );
  }

  const params = new URLSearchParams();

  params.set("j_username", myturnUsername);
  params.set("j_password", myturnPassword);

  const rsp = await fetch(`https://${host}/library/j_spring_security_check`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const setCookieRsp = rsp.headers.get("set-cookie") ?? "";

  const sessionCookie = setCookieRsp
    .split(";")
    .find((s) => s.startsWith("JSESSIONID"))
    ?.trim();

  return sessionCookie;
};

const getReport = async () => {
  const cookie = await getLoginCookie();

  const searchParams = new URLSearchParams();

  searchParams.append("from", "struct");
  searchParams.append("from_date", FROM_DATE);
  searchParams.append("from_tz", "America/Los_Angeles");
  searchParams.append("from_time", "00:00");

  searchParams.append("to", "struct");
  searchParams.append("to_date", TO_DATE);
  searchParams.append("to_tz", "America/Los_Angeles");
  searchParams.append("to_time", "23:59:59.999");

  searchParams.append("type", "0");
  searchParams.append("format", "csv");
  searchParams.append("extension", "csv");

  const params = {
    method: "POST",
    headers: {
      Cookie: cookie ?? "",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: searchParams.toString(),
  };

  const rsp = await fetch(
    `https://${host}/library/orgMembership/exportMembershipChangeReport`,
    params
  );

  return await rsp.text();
};

const csvReport = await getReport();

const records = parse<Data>(csvReport, {
  columns: true,
  skip_empty_lines: true,
});

const generateReport = (records: Data[]) => {
  const payments: Entry[] = [];
  const counts: Entry[] = [];

  const cumPayments: Entry[] = [];
  const cumCounts: Entry[] = [];

  const dates = [...new Set(records.map((entry) => entry["Date"]))].sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  for (const date of dates) {
    const dataForDate = records.filter((entry) => entry["Date"] === date);

    const unix = new Date(date).getTime();

    const payment: Entry = { date: unix };
    const count: Entry = { date: unix };

    for (const type of TYPE_FILTER) {
      payment[type] = 0;
      count[type] = 0;
    }

    for (const data of dataForDate) {
      if (!TYPE_FILTER.includes(data["To"])) continue;

      const membershipType = data["To"];
      let cost = parseFloat(data["Cost"]);

      if (isNaN(cost)) cost = 0;
      (payment[membershipType] as number) += cost;
      (count[membershipType] as number) += 1;
    }

    payments.push(payment);
    counts.push(count);
  }

  // special case: first day cumulative is the same
  cumPayments[0] = { ...payments[0] };
  cumCounts[0] = { ...counts[0] };

  for (let i = 1; i < payments.length; i++) {
    const payment = payments[i];
    const prevPayment = cumPayments[i - 1];

    const cumPayment: Entry = { date: payment.date };

    for (const type of TYPE_FILTER) {
      cumPayment[type] =
        (prevPayment[type] as number) + (payment[type] as number);
    }

    const count = counts[i];
    const prevCount = cumCounts[i - 1];

    const cumCount: Entry = { date: payment.date };

    for (const type of TYPE_FILTER) {
      cumCount[type] = (prevCount[type] as number) + (count[type] as number);
    }

    cumPayments.push(cumPayment);
    cumCounts.push(cumCount);
  }

  fs.writeFileSync(
    "./src/cum_payments.json",
    JSON.stringify(cumPayments, null, 4)
  );

  fs.writeFileSync("./src/cum_counts.json", JSON.stringify(cumCounts, null, 4));
};

generateReport(records);
