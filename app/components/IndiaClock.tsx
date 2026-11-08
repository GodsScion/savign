"use client";

import { useEffect, useState } from "react";

const indiaTime = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const indiaIso = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

type Reading = { label: string; iso: string };

function readClock(): Reading {
  const now = new Date();
  return {
    label: indiaTime.format(now).toLowerCase(),
    iso: `${indiaIso.format(now).replace(" ", "T")}+05:30`,
  };
}

function msToNextMinute() {
  return 60_000 - (Date.now() % 60_000);
}

export function IndiaClock() {
  const [reading, setReading] = useState<Reading | null>(null);

  useEffect(() => {
    let timer = 0;
    const tick = () => {
      setReading(readClock());
      timer = window.setTimeout(tick, msToNextMinute());
    };
    tick();
    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <p className="clock">
      India{" "}
      <time data-clock dateTime={reading?.iso}>
        {reading ? `${reading.label} IST` : ""}
      </time>
    </p>
  );
}
