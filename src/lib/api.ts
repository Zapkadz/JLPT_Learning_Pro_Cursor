import { useEffect, useState } from "react";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch("/api" + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });
  } catch (error) {
    if ((error as Error).name === "AbortError") throw error;
    throw new ApiError(
      "Không kết nối được máy chủ. Kiểm tra kết nối rồi thử lại; nội dung đang nhập vẫn được giữ.",
      0,
    );
  }
  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new ApiError(
      "Máy chủ chưa sẵn sàng. Vui lòng thử lại sau ít phút.",
      response.status,
    );
  }
  if (!response.ok)
    throw new ApiError(data.error || "Không thể kết nối.", response.status);
  return data;
}
export function post<T = any>(path: string, data: unknown = {}) {
  return api<T>(path, { method: "POST", body: JSON.stringify(data) });
}
export function useData<T = any>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [version, reload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    setData(null);
    api<T>(path, { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, reload: () => reload((v) => v + 1) };
}
export const dateTime = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
