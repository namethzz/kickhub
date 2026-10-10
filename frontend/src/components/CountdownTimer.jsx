import { useEffect, useState } from "react";

export default function CountdownTimer({ start_datetime, end_datetime }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
  const [status, setStatus] = useState("waiting"); // waiting | startingSoon | started | ended

  useEffect(() => {
    if (!start_datetime || !end_datetime) return;

    const startTime = new Date(start_datetime);
    const endTime = new Date(end_datetime);

    const updateCountdown = () => {
      const now = new Date();

      if (now >= endTime) {
        setStatus("ended");
        return;
      }

      if (now >= startTime) {
        setStatus("started");
        return;
      }

      const diff = startTime - now;
      const totalMinutes = Math.floor(diff / 1000 / 60);
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
      const minutes = totalMinutes % 60;

      setTimeLeft({ days, hours, minutes });

      if (days === 0 && hours === 0 && minutes <= 5) {
        setStatus("startingSoon");
      } else {
        setStatus("waiting");
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000 * 15);
    return () => clearInterval(interval);
  }, [start_datetime, end_datetime]);

  if (!start_datetime || !end_datetime) {
    return <p className="text-sm text-gray-400">⏳ กำลังโหลดข้อมูล...</p>;
  }

  const renderMessage = () => {
    switch (status) {
      case "ended":
        return (
          <p className="text-sm text-red-600 font-medium">⚽ เกมได้จบลงแล้ว</p>
        );
      case "started":
        return (
          <p className="text-sm text-orange-600 font-medium">
            🔥 เกมได้เริ่มต้นขึ้นแล้ว!
          </p>
        );
      case "startingSoon":
        return (
          <p className="text-sm text-yellow-600 font-medium">
            ⏰ เกมกำลังจะเริ่มในอีกไม่กี่นาทีนี้!
          </p>
        );
      default:
        return (
          <span className="flex items-center space-x-2">
            <p className="text-sm text-gray-700">เริ่มในอีก</p>
            <p className="text-xs text-green-600 font-semibold">
              {timeLeft.days} วัน {timeLeft.hours} ชั่วโมง {timeLeft.minutes}{" "}
              นาที
            </p>
          </span>
        );
    }
  };

  return renderMessage();
}
