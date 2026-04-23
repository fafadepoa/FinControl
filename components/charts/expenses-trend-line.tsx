"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ExpensesTrendLine({ data }: { data: Array<{ point: string; total: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(126,140,167,0.25)" />
          <XAxis dataKey="point" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            formatter={(value) => {
              const amount = Number(value ?? 0);
              return [`R$ ${amount.toLocaleString("pt-BR")}`, "Valor"];
            }}
          />
          <Line type="monotone" dataKey="total" stroke="var(--fc-success)" strokeWidth={2.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
