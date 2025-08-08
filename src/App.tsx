import "./App.css";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import cumPayments from "./cum_payments.json";
import cumCounts from "./cum_counts.json";
import today from "./today.json";
import { useState } from "react";

const TYPE_FILTER = [
  "Flexible",
  "Standard (Monthly)",
  "Standard (Annual)",
  "Sustaining (Annual)",
  "regular",
] as const;

const COLORS: {
  dataKey: (typeof TYPE_FILTER)[number];
  color: string;
}[] = [
  {
    dataKey: "Flexible",
    color: "#0074D9", // Strong blue
  },
  {
    dataKey: "Standard (Annual)",
    color: "#2ECC40", // Vivid green
  },
  {
    dataKey: "Standard (Monthly)",
    color: "#FF4136", // Bright red
  },
  {
    dataKey: "Sustaining (Annual)",
    color: "#B10DC9", // Deep purple
  },
  {
    dataKey: "regular",
    color: "#FF851B", // Orange
  },
];

const data = {
  "Cumulative Payments ($)": cumPayments.sort((a, b) => a.date - b.date),
  "Cumulative Renewal Count": cumCounts,
};

const todayDate = new Date(today.today);

export default function App() {
  const [selectedData, setSelectedData] = useState<keyof typeof data>(
    "Cumulative Payments ($)"
  );
  const [stack, setStack] = useState<boolean>(true);

  // Membership type selection state
  const [selectedTypes, setSelectedTypes] = useState<
    (typeof TYPE_FILTER)[number][]
  >(TYPE_FILTER as unknown as (typeof TYPE_FILTER)[number][]);

  // Handler for toggling membership type selection
  const handleTypeToggle = (type: (typeof TYPE_FILTER)[number]) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="main">
      <h1>CHTL Membership Renewals</h1>
      <p>
        <i>Data as of {todayDate.toLocaleString()}</i>
      </p>
      <label>
        <input
          type="checkbox"
          checked={stack}
          onChange={() => setStack(!stack)}
        />
        Stack Data
      </label>

      <h4>Visualization</h4>

      <div
        style={{
          marginBottom: "1em",
          display: "flex",
          flexDirection: "row",
        }}
      >
        {Object.keys(data).map((key) => (
          <div
            key={key}
            style={{
              marginRight: "1em",
            }}
          >
            <input
              type="radio"
              name="data"
              id={key}
              value={key}
              checked={selectedData === key}
              onChange={() => setSelectedData(key as keyof typeof data)}
            />
            <label htmlFor={key}>{key}</label>
          </div>
        ))}
      </div>

      <h4>Visible Membership Types</h4>

      {/* Membership type checkboxes */}
      <div
        style={{
          marginBottom: "2em",
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
        }}
      >
        {TYPE_FILTER.map((type) => (
          <div key={type} style={{ marginRight: "1em" }}>
            <input
              type="checkbox"
              id={`type-${type}`}
              checked={selectedTypes.includes(type)}
              onChange={() => handleTypeToggle(type)}
            />
            <label htmlFor={`type-${type}`}>{type}</label>
          </div>
        ))}
      </div>

      <div style={{ width: "100%", height: "400px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data[selectedData]}
            margin={{
              right: 50,
              left: 50,
              bottom: 0,
            }}
          >
            {COLORS.filter((color) =>
              selectedTypes.includes(color.dataKey)
            ).map((color) => (
              <Area
                key={color.dataKey}
                stroke={color.color}
                fill={color.color}
                dataKey={color.dataKey}
                stackId={stack ? "1" : undefined}
                type="basis"
              />
            ))}
            <CartesianGrid />
            <XAxis
              dataKey="date"
              tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
              type="number"
              scale="time"
              interval="equidistantPreserveStart"
              domain={["auto", "auto"]}
            />
            <YAxis
              label={{
                value: selectedData,
                angle: -90,
                position: "insideLeft",
                offset: -20,
              }}
              tickFormatter={(value) => {
                // Format the value based on the selected data type
                if (selectedData === "Cumulative Payments ($)") {
                  return `$${value.toLocaleString()}`;
                }
                return value.toLocaleString();
              }}
            />
            <Legend />
            <Tooltip
              content={({ payload, label }) => {
                if (!payload || payload.length === 0) return null;
                const total = payload.reduce(
                  (sum, entry) => sum + (entry.value ?? 0),
                  0
                );
                return (
                  <div
                    style={{
                      background: "white",
                      border: "1px solid #ccc",
                      padding: "8px",
                    }}
                  >
                    <div>
                      <strong>
                        {typeof label === "string" || typeof label === "number"
                          ? `Date ≤ ${new Date(label).toLocaleDateString()}`
                          : label}
                      </strong>
                    </div>
                    <table>
                      <tbody>
                        {payload.map((entry) => (
                          <tr key={entry.dataKey}>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 10,
                                  height: 10,
                                  background: entry.color,
                                  marginRight: 6,
                                }}
                              />
                              {entry.name}
                            </td>
                            <td style={{ textAlign: "right", paddingLeft: 12 }}>
                              {selectedData === "Cumulative Payments ($)"
                                ? `$${entry.value.toLocaleString()}`
                                : entry.value.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <hr />
                    <div style={{ fontWeight: "bold", textAlign: "right" }}>
                      Grand Total:{" "}
                      {selectedData === "Cumulative Payments ($)"
                        ? `$${total.toLocaleString()}`
                        : total.toLocaleString()}
                    </div>
                  </div>
                );
              }}
              formatter={(value, name) => {
                // Format the value based on the selected data type
                if (selectedData === "Cumulative Payments ($)") {
                  return [`$${value.toLocaleString()}`, name];
                }
                return [value, name];
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
