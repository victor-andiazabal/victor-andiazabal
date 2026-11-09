import { describe, expect, it } from 'vitest';
import { parseTheme, VIEW_LABEL, VIEWS, viewFromQuery, viewTitle } from '../views';

describe('viewFromQuery', () => {
  it('opens Today by default and for unknown views', () => {
    expect(viewFromQuery('')).toBe('today');
    expect(viewFromQuery('?view=nope')).toBe('today');
  });

  it('keeps ?view=dashboard working as an alias of Today', () => {
    expect(viewFromQuery('?view=dashboard')).toBe('today');
  });

  it('opens a named view directly, including the ground console', () => {
    expect(viewFromQuery('?view=ground')).toBe('ground');
    expect(viewFromQuery('?view=body')).toBe('body');
  });
});

describe('viewTitle', () => {
  it('names every screen, then the app', () => {
    expect(viewTitle('checkin')).toBe('Check-in · Space Vigil');
    expect(VIEWS.every((v) => VIEW_LABEL[v].length > 0)).toBe(true);
  });
});

describe('parseTheme', () => {
  it('accepts only the two known themes and falls back to dark', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
    expect(parseTheme(null)).toBe('dark');
    expect(parseTheme('neon')).toBe('dark');
  });
});
