export const formatStatusBoardCount = (count: number): string => {
  if (count < 10_000) return `${count.toLocaleString('ko-KR')}건`;
  const divisor = count >= 100_000_000 ? 100_000_000 : 10_000;
  const unit = divisor === 10_000 ? '만' : '억';
  const value = Math.floor((count / divisor) * 10) / 10;
  return `${value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}${unit} 건`;
};
