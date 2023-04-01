import { useEffect, useState } from "react";
import { cn } from "../utils/tw";

const MONTH_NAMES = [
  "Jan.",
  "Feb.",
  "March",
  "April",
  "May",
  "June",
  "July",
  "Aug.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
];

function getFormattedDate(
  date: Date,
  preformattedDate: boolean | string = false
) {
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  const ampmString = date.getHours() > 12 ? "PM" : "AM";
  let hours = date.getHours() > 12 ? date.getHours() % 12 : date.getHours();
  if (hours === 0) {
    hours = 12;
  }

  let minutes: number | string = date.getMinutes();

  if (minutes < 10) {
    // Adding leading zero to minutes
    minutes = `0${minutes}`;
  }

  if (preformattedDate) {
    // Today at 10:20
    // Yesterday at 10:20
    return `${preformattedDate} at ${hours}:${minutes} ${ampmString}`;
  }

  // January 10, 2017
  return `${month} ${day}, ${year}`;
}

const timeSince = (date: Date) => {
  const DAY_IN_MS = 86400000; // 24 * 60 * 60 * 1000
  const today = new Date();
  const yesterday = new Date(today.valueOf() - DAY_IN_MS);
  const seconds = Math.round((today.valueOf() - date.valueOf()) / 1000);
  const minutes = Math.round(seconds / 60);
  const isToday = today.toDateString() === date.toDateString();
  const isYesterday = yesterday.toDateString() === date.toDateString();
  const isThisYear = today.getFullYear() === date.getFullYear();

  if (seconds < 5) {
    return "now";
  } else if (seconds < 60) {
    return `${seconds} seconds ago`;
  } else if (seconds < 90) {
    return "about a minute ago";
  } else if (minutes < 60) {
    return `${minutes} minutes ago`;
  } else if (isToday) {
    return getFormattedDate(date, "Today"); // Today at 10:20
  } else if (isYesterday) {
    return getFormattedDate(date, "Yesterday"); // Yesterday at 10:20
  } else if (isThisYear) {
    return getFormattedDate(date, false);
  }

  return getFormattedDate(date);
};

const Timestamp: React.FC<{ timestamp: Date }> = ({ timestamp }) => {
  const [displayTime, setDisplayTime] = useState(timeSince(timestamp));
  const [serverRendering, setServerRendering] = useState(true);

  useEffect(() => {
    setServerRendering(false);
    setDisplayTime(timeSince(timestamp));
    const interval = setInterval(
      () => setDisplayTime(timeSince(timestamp)),
      1000
    );
    return () => {
      clearInterval(interval);
    };
  }, [timestamp]);

  return (
    <time
      // if we are on the server, hide this element but keep its size to avoid too much layout shift
      className={cn(serverRendering ? "invisible" : null)}
      suppressHydrationWarning
    >
      {displayTime}
    </time>
  );
};

export default Timestamp;
