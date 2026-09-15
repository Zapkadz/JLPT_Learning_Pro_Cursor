import { test, expect } from "@playwright/test";

test("grammar N2 journey: lesson → pattern → practice modes → reload → SRS", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => consoleErrors.push(String(err)));

  await page.goto("/login");
  await page.getByLabel("Tên của bạn").fill("Grammar QA");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`grammar-qa-${Date.now()}@example.test`);
  await page.locator("input[name=password]").fill("Test-only-password-2026");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mỗi ngày một chút, tiến xa hơn." }),
  ).toBeVisible();

  await page.getByRole("link", { name: "Học ngữ pháp", exact: true }).click();
  await expect(page.getByText("mục tiêu khóa").first()).toBeVisible();
  await expect(page.locator(".grammar-metrics")).toContainText("/ 141");

  await page.getByRole("link", { name: /Học bài 1/ }).click();
  await expect(page.getByRole("heading", { name: /とき|直後/ })).toBeVisible();

  await page.getByRole("link", { name: "〜際（に・は）" }).click();
  await expect(page.getByRole("heading", { name: "〜際（に・は）" })).toBeVisible();
  await expect(page.getByText(/Biến thể:/)).toBeVisible();
  await expect(page.locator(".grammar-example")).toHaveCount(3);

  await page.getByRole("button", { name: /Hiện furigana/ }).click();
  await expect(page.locator("rt").first()).toBeVisible();
  await page.getByRole("button", { name: "Đánh dấu đã đọc" }).click();
  await expect(page.getByRole("button", { name: "Đã đọc" })).toBeDisabled();

  await page.getByRole("link", { name: "Làm bài tập" }).first().click();
  await expect(page.getByText(/Đã kiểm tra/)).toBeVisible();

  // VI → JA: one check + self-review if needed
  const viJa = page.locator("#panel-vi-ja .grammar-exercise").first();
  await viJa.getByRole("textbox").fill("Câu dịch thử cho hành trình E2E.");
  await viJa.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(viJa.locator(".grammar-feedback")).toBeVisible();
  const selfReview = viJa.getByRole("button", { name: "Tôi đã tự đối chiếu" });
  if (await selfReview.isVisible()) await selfReview.click();

  // JA → VI
  await page.getByRole("tab", { name: /Nhật → Việt/ }).click();
  const jaVi = page.locator("#panel-ja-vi .grammar-exercise").first();
  await jaVi.getByRole("textbox").fill("Bản dịch tiếng Việt thử nghiệm.");
  await jaVi.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(jaVi.locator(".grammar-feedback")).toBeVisible();
  const selfReviewJa = jaVi.getByRole("button", {
    name: "Tôi đã tự đối chiếu",
  });
  if (await selfReviewJa.isVisible()) await selfReviewJa.click();

  // Ordering: place all four tokens then check
  await page.getByRole("tab", { name: /Sắp xếp câu/ }).click();
  const order = page.locator("#panel-order .grammar-exercise").first();
  const tokens = order.locator(".grammar-token-bank button");
  await expect(tokens).toHaveCount(4);
  for (let i = 0; i < 4; i++) await tokens.nth(i).click();
  await order.getByRole("button", { name: "Kiểm tra" }).click();
  await expect(order.locator(".grammar-feedback")).toBeVisible();

  await expect(page.getByText(/Đã kiểm tra\s*3\/30/)).toBeVisible();

  await page.reload();
  await expect(page.getByText(/Đã kiểm tra\s*3\/30/)).toBeVisible();
  await page.getByRole("tab", { name: /Việt → Nhật/ }).click();
  await expect(
    page.locator("#panel-vi-ja .grammar-feedback").first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Nhật → Việt/ }).click();
  await expect(
    page.locator("#panel-ja-vi .grammar-feedback").first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Sắp xếp câu/ }).click();
  await expect(
    page.locator("#panel-order .grammar-feedback").first(),
  ).toBeVisible();

  await page.getByRole("link", { name: "← Quay lại mẫu ngữ pháp" }).click();
  await page.getByRole("button", { name: "Thêm vào ôn tập" }).click();
  await expect(page.getByText(/Đã thêm mẫu vào lịch ôn|đã có trong lịch ôn/)).toBeVisible();

  await page.getByRole("link", { name: /← Bài 1/ }).click();
  await expect(page.getByText(/✓ Đã đọc/)).toBeVisible();

  expect(
    consoleErrors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("Download the React DevTools") &&
        !e.includes("401 (Unauthorized)"),
    ),
  ).toEqual([]);
});
