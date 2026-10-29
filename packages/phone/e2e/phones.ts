import { type Browser, expect, type Page } from '@playwright/test';
import { STRINGS } from '../src/strings/pt-BR.ts';

/** A phone of the E2E tests: one browser context, so one localStorage, per player. */
export interface Phone {
  page: Page;
  close(): Promise<void>;
}

/** Opens `/<code>` on a new phone, which lands on the join screen. */
export async function openPhone(browser: Browser, code: string): Promise<Phone> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`/${code}`);
  return { page, close: () => context.close() };
}

/** Opens one phone per nickname and joins each with the first free color. */
export async function openPhones(browser: Browser, code: string, nicknames: readonly string[]): Promise<Phone[]> {
  const phones: Phone[] = [];
  for (const nickname of nicknames) {
    const phone = await openPhone(browser, code);
    await joinOnPhone(phone.page, nickname);
    phones.push(phone);
  }
  return phones;
}

/** Types the nickname on the join screen and enters, waiting for the join screen to go away. */
export async function joinOnPhone(page: Page, nickname: string): Promise<void> {
  await page.getByLabel(STRINGS.nicknameLabel).fill(nickname);
  await page.getByRole('button', { name: STRINGS.join }).click();
  await expect(page.getByLabel(STRINGS.nicknameLabel)).toBeHidden();
}
