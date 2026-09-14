import { useState } from "react";
import { dayKey } from "../../shared/domain";
export function Heatmap({
  activity,
  today = dayKey(),
}: {
  activity: Record<string, number>;
  today?: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const end = new Date(today + "T12:00:00Z");
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const dates: string[] = [];
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1))
    dates.push(d.toISOString().slice(0, 10));
  return (
    <section className="panel heatmap-panel">
      <div className="section-head">
        <h2>Nhịp học của bạn</h2>
        <span className="legend">
          Ít hơn{" "}
          {[0, 1, 2, 3, 4].map((i) => (
            <i key={i} data-intensity={i} />
          ))}{" "}
          Nhiều hơn
        </span>
      </div>
      <div className="heatmap-scroll">
        <div className="month-labels">
          {dates
            .filter((date, i) => i === 0 || date.endsWith("-01"))
            .map((date) => (
              <span key={date}>Thg {Number(date.slice(5, 7))}</span>
            ))}
        </div>
        <div className="heatmap-body">
          <div className="day-labels">
            <span>T2</span>
            <span>T4</span>
            <span>T6</span>
          </div>
          <div className="heatmap">
            {dates.map((date, index) => {
              const count = activity[date] || 0;
              return (
                <button
                  key={date}
                  className="heat-cell"
                  tabIndex={date === (selected || today) ? 0 : -1}
                  onKeyDown={(event) => {
                    const offset = (
                      {
                        ArrowRight: 7,
                        ArrowLeft: -7,
                        ArrowUp: -1,
                        ArrowDown: 1,
                      } as Record<string, number>
                    )[event.key];
                    if (offset) {
                      event.preventDefault();
                      const next = Math.max(
                        0,
                        Math.min(index + offset, dates.length - 1),
                      );
                      setSelected(dates[next]);
                      (
                        event.currentTarget.parentElement?.children[
                          next
                        ] as HTMLElement
                      )?.focus();
                    }
                  }}
                  data-intensity={
                    count === 0
                      ? 0
                      : count < 5
                        ? 1
                        : count < 10
                          ? 2
                          : count < 20
                            ? 3
                            : 4
                  }
                  aria-label={`${date}: ${count} kiến thức đã luyện`}
                  title={`${date}: ${count} kiến thức`}
                  onClick={() => setSelected(date)}
                />
              );
            })}
          </div>
        </div>
      </div>
      <div className="heatmap-foot">
        <span role="status">
          {selected
            ? `${selected}: ${activity[selected] || 0} kiến thức đã luyện.`
            : "Mỗi ô là một ngày. Chọn một ô để xem chi tiết."}
        </span>
        <span>Kiên trì là sức mạnh.</span>
      </div>
    </section>
  );
}
