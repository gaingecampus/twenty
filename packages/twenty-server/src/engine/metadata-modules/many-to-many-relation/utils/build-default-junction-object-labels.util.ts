export const buildDefaultJunctionObjectLabels = ({
  sourceLabelSingular,
  targetLabelSingular,
}: {
  sourceLabelSingular: string;
  targetLabelSingular: string;
}): { labelSingular: string; labelPlural: string } => {
  const labelSingular = `${sourceLabelSingular} ${targetLabelSingular} Link`;
  const labelPlural = `${sourceLabelSingular} ${targetLabelSingular} Links`;

  return { labelSingular, labelPlural };
};
