import { calculateCO2Reduction, calculatePoints } from '../src/utils/calculations';

describe('calculatePoints', () => {
  it('calculates plastic points correctly', () => {
    expect(calculatePoints('plastic', 2.5)).toBe(25);
  });

  it('calculates metal points correctly', () => {
    expect(calculatePoints('metal', 1.2)).toBe(18);
  });
});

describe('calculateCO2Reduction', () => {
  it('calculates paper co2 reduction correctly', () => {
    expect(calculateCO2Reduction('paper', 4)).toBe(6);
  });

  it('calculates glass co2 reduction correctly', () => {
    expect(calculateCO2Reduction('glass', 3)).toBe(1.5);
  });
});
