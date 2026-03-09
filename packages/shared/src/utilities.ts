const formatKeyLabel = (options: string[]) =>
  options.map((option) => {
    return {
      key: option,
      label: option,
    };
  });

const filterRates = (
  acceptedRates: string[],
  baseRates: Record<string, number>,
) => {
  return Object.keys(baseRates).reduce(
    (acc: Record<string, number>, curr: string) => {
      if (acceptedRates.includes(curr)) {
        acc[curr] = baseRates[curr];
      }
      return acc;
    },
    {},
  );
};

export { formatKeyLabel, filterRates };
