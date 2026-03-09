const formatKeyLabel = (options: string[]) =>
  options.map((option) => {
    return {
      key: option,
      label: option,
    };
  });

export { formatKeyLabel };
