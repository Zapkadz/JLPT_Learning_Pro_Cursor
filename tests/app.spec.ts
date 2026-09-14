import { test, expect } from "@playwright/test";
test("learner can import, review, complete a quiz and retain progress", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Tên của bạn").fill("Người học QA");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`qa-${Date.now()}@example.test`);
  await page.locator("input[name=password]").fill("Test-only-password-2026");
  await page
    .getByRole("button", { name: "Tạo tài khoản", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Mỗi ngày một chút, tiến xa hơn." }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Tạo bộ thẻ", exact: true }).click();
  await page.getByLabel("Tên bộ thẻ", { exact: true }).fill("Từ vựng của tôi");
  await page.getByRole("button", { name: "Nhập hàng loạt" }).click();
  await page.getByLabel("Nội dung nhập").fill("猫\tMèo\tねこ\n犬\tChó\tいぬ");
  await page.getByRole("button", { name: "Thêm 2 thẻ vào bộ" }).click();
  await page
    .getByRole("button", { name: "Lưu bộ thẻ", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Từ vựng của tôi" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ôn bộ này" }).click();
  await page.getByRole("button", { name: "Hiện đáp án" }).click();
  await expect(page.locator(".flashcard-back")).toContainText("Mèo");
  await page.getByRole("button", { name: /3 · Nhớ đúng/ }).click();
  await page.getByRole("button", { name: "Hiện đáp án" }).click();
  await page.getByRole("button", { name: /4 · Nhớ nhanh/ }).click();
  await expect(
    page.getByRole("heading", { name: "Bạn đã hoàn thành lượt ôn này!" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Luyện thi JLPT", exact: true }).click();
  await page.getByRole("button", { name: "Bắt đầu luyện tập" }).click();
  while (
    await page
      .getByRole("button", { name: "Câu tiếp", exact: true })
      .isVisible()
  ) {
    await page.locator(".answer").first().click();
    await page.getByRole("button", { name: "Câu tiếp", exact: true }).click();
  }
  await page.locator(".answer").first().click();
  await page
    .getByRole("button", { name: "Nộp bài", exact: true })
    .first()
    .click();
  await expect(page.locator(".result-summary")).toContainText("câu đúng");
  await page.getByRole("link", { name: "Tiến độ", exact: true }).click();
  await expect(page.locator(".stats-row")).toContainText("1 ngày");
  await page.reload();
  await expect(page.locator(".stats-row")).toContainText("1 ngày");
});
