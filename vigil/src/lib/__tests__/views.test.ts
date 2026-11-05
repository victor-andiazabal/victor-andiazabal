import { describe, expect, it } from 'vitest';
import { viewFromQuery } from '../views';

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
