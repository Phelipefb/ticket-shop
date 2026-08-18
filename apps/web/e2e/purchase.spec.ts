import { expect, test } from "@playwright/test";

test("cliente compra um ingresso de ponta a ponta", async ({ page }) => {
  const loginResponse = await page.request.post(
    "http://127.0.0.1:3334/auth/login",
    {
      data: {
        email: "cliente1@ticketshop.dev",
        password: "Cliente123!",
      },
    },
  );

  expect(loginResponse.ok()).toBeTruthy();

  const session = (await loginResponse.json()) as {
    accessToken: string;
    user: { id: string; name: string; email: string; role: string };
  };

  await page.goto("/");
  await page.evaluate((authenticatedSession) => {
    localStorage.setItem("cinepass:accessToken", authenticatedSession.accessToken);
    localStorage.setItem("cinepass:user", JSON.stringify(authenticatedSession.user));
  }, session);
  await page.reload();

  await page.locator('a[href^="/events/"]').first().click();
  await expect(page.getByText("Mapa de assentos")).toBeVisible();

  await page
    .locator('button[aria-pressed="false"]:not([disabled])')
    .first()
    .click();
  await page.getByRole("button", { name: /Reservar por/ }).click();

  await expect(page).toHaveURL(/\/checkout\//);
  await page.getByRole("button", { name: "Pagar e gerar ingresso" }).click();

  await expect(
    page.getByRole("heading", { name: "Ingresso gerado!" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver meus ingressos" }).click();
  await expect(
    page.getByRole("heading", { name: "Meus ingressos" }),
  ).toBeVisible();
});
