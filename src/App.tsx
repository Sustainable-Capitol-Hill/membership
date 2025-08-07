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
    color: "#FF5C18",
  },
  {
    dataKey: "Standard (Annual)",
    color: "#23FF5D",
  },
  {
    dataKey: "Standard (Monthly)",
    color: "#3D5EFE",
  },
  {
    dataKey: "Sustaining (Annual)",
    color: "#F315FE",
  },
  {
    dataKey: "regular",
    color: "#FFBC17",
  },
];

const data = {
  "Cumulative Payments": cumPayments.sort((a, b) => a.date - b.date),
  "Cumulative Renewals": cumCounts,
};

export default function App() {
  const [selectedData, setSelectedData] = useState<keyof typeof data>(
    "Cumulative Payments",
  );

  const [stack, setStack] = useState<boolean>(true);

  return (
    <div className="main">
      <h1>Tool Library Memberships</h1>
      <label>
        <input
          type="checkbox"
          checked={stack}
          onChange={() => setStack(!stack)}
        />
        Stack
      </label>

      <div
        style={{
          marginBottom: "1em",
          display: "flex",
          flex: "row",
        }}
      >
        {Object.keys(data).map((key) => (
          <div
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
            <label for={key}>{key}</label>
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
            {COLORS.map((color) => (
              <Area
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
                offset: -5,
              }}
            />
            <Legend />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
