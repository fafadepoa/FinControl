"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function ExpensesMonthlyChart({ data }: { data: Array<{ month: string; total: number }> }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            formatter={(value) => {
              const amount = Number(value ?? 0);
              return [`R$ ${amount.toLocaleString("pt-BR")}`, "Total"];
            }}
          />
          <Bar dataKey="total" fill="var(--fc-primary)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
