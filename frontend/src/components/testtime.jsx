import { useState } from "react";

export default function TimeSelector() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");
  const [result, setResult] = useState(null);

  const handleSubmit = () => {
    if (!date || !startTime || !endTime) return;

    const start = new Date(`${date}T${startTime}:00.000`);
    const end = new Date(`${date}T${endTime}:00.000`);

    setResult({
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    });
  };

  return (
    <div>
      <h1>search time</h1>

      <p>date</p>
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      <span className="flex gap-3 mt-2">
        <span className="flex flex-col">
          <p>start time</p>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          >
            {[...Array(24)].map((_, hour) => {
              const timeString = hour.toString().padStart(2, "0") + ":00";
              return (
                <option key={hour} value={timeString}>
                  {timeString}
                </option>
              );
            })}
          </select>
        </span>

        <span className="flex flex-col">
          <p>end time</p>
          <select value={endTime} onChange={(e) => setEndTime(e.target.value)}>
            {[...Array(24)].map((_, hour) => {
              const timeString = hour.toString().padStart(2, "0") + ":00";
              return (
                <option key={hour} value={timeString}>
                  {timeString}
                </option>
              );
            })}
          </select>
        </span>
      </span>

      <button className="mt-4" onClick={handleSubmit}>
        Submit
      </button>

      {result && (
        <pre className="mt-4 bg-gray-100 p-2 rounded">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
